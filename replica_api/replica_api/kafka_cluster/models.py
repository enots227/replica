from requests import Response
from django.conf import settings
from kafka_cluster.kafka import Kafka
from django.conf import settings
from kafka_cluster.kafka import Kafka


# Source ############################
# Schema Registery
async def create_src_schema() -> Response:
    """Create the database source schema.

    Returns:
        Response from the Kafka Confluent Schema Registry API.
    """
    kafka: Kafka = settings.KAFKA

    return await kafka.schema_registry.create_schema('replica_src_account-value', {
        'type': 'record',
        'name': 'account',
        'fields': [
            {
                'name': 'acct_id',
                'type': 'int'
            },
            {
                'name': 'name',
                'type': [
                    'null',
                    'string'
                ],
                'default': None
            },
            {
                'name': 'last_change_id',
                'type': 'long'
            },
            {
                'name': 'last_modified',
                'type': {
                    'type': 'long',
                    'connect.version': 1,
                    'connect.name': 'org.apache.kafka.connect.data.Timestamp',
                    'logicalType': 'timestamp-millis'
                }
            }
        ],
        'connect.name': 'account',
    })


# KSQL Table
async def create_src_ktable() -> Response:
    """Create the database source KSQL table.

    Returns:
        Response from the KSQL API.
    """
    kafka: Kafka = settings.KAFKA

    # add NON NULL to columns once 
    #   https://github.com/confluentinc/ksql/issues/4436
    #   released and remove createSchema step

    return await kafka.ksql.execute(
        'CREATE TABLE "replica_src_account" ('
            '"id" INT PRIMARY KEY,'
            '"acct_id" INT,' # NON NULL
            '"name" STRING,'
            '"last_change_id" BIGINT,' # NON NULL
            '"last_modified" TIMESTAMP' # NON NULL
        ') WITH ('
            'KAFKA_TOPIC=\'replica_src_account\','
            'PARTITIONS=1,'
            'KEY_FORMAT=\'KAFKA\','
            'VALUE_FORMAT=\'AVRO\''
        ');')


async def delete_src_ktable() -> Response:
    """Delete the database source KSQL table.

    Returns:
        Response from the KSQL API.
    """
    kafka: Kafka = settings.KAFKA

    return await kafka.ksql.execute('DROP TABLE "replica_src_account";')


# Connect
async def create_src_connector(db_hostname: str, db_port: int, db_name: str, 
    db_user: str, db_password: str, poll_interval: int) -> Response:
    """Create the database source connector.

    Args:
        db_hostname: The source database hostname.
        db_port: The source database port.
        db_name: The source database name.
        db_user: The source database username.
        db_password: The source database password.
        topic_prefix: The topic prefix to associate the source database table to.
        poll_interval: The frequency of when the SQL server is queried for changes.

    Returns:
        Response from the Kafka connect API.
    """
    kafka: Kafka = settings.KAFKA

    return await kafka.connector.create_connector('replica_src', {
        'connector.class': 'io.confluent.connect.jdbc.JdbcSourceConnector',
        'connection.url': F'jdbc:postgresql://{db_hostname}:{db_port}/{db_name}',
        'connection.user': db_user,
        'connection.password': db_password,
        'topic.prefix': 'replica_src_',
        'table.whitelist': 'public.account',
        'mode': 'timestamp+incrementing',
        'timestamp.column.name': 'last_modified',
        'incrementing.column.name': 'acct_id',
        'transforms': 'createKey,extractInt',
        'transforms.createKey.type': 'org.apache.kafka.connect.transforms.ValueToKey',
        'transforms.createKey.fields': 'acct_id',
        'transforms.extractInt.type': 'org.apache.kafka.connect.transforms.ExtractField$Key',
        'transforms.extractInt.field': 'acct_id',
        'key.converter': 'org.apache.kafka.connect.converters.IntegerConverter',
        'value.converter': 'io.confluent.connect.avro.AvroConverter',
        'value.converter.schema.registry.url': kafka.schema_registry.url,
        'continuum.topic': 'replica_status',
        'continuum.bootstrap.servers': kafka.brokers,
        'continuum.schema.registry.url': kafka.schema_registry.url,
        'continuum.label': 'replica_src',
        'poll.interval.ms': poll_interval,
    })


async def delete_src_connector() -> Response:
    """Delete the database source connector.

    Returns:
        Response from the Kafka connect API.
    """
    kafka: Kafka = settings.KAFKA

    return await kafka.connector.delete_connector('replica_src')


# Sink ##############################
# KSQL Table
async def create_snk_ktable(db_hostname: str, db_name: str, db_table: str) -> Response:
    """Create the database sink KSQL table.

    Args:
        db_hostname: The sink database hostname.
        db_name: The sink database name.
        db_table: The sink database table.

    Returns:
        Response from the KSQL API.
    """
    kafka: Kafka = settings.KAFKA

    return await kafka.ksql.execute(
        F'CREATE TABLE "replica_snk_{db_hostname}_{db_name}_{db_table}" AS ' +
        'SELECT ' +
            'a."id" AS KEY,' +
            'AS_VALUE(a."acct_id") AS "acct_id",' +
            'a."name" AS "name",' +
            'a."last_change_id" AS "last_change_id",' +
            'a."last_modified" AS "last_modified" ' +
        'FROM "replica_trg_tbl" AS t ' +
        'INNER JOIN "replica_src_account" AS a ON a."id" = t."acct_id" ' +
        'WHERE ' +
            F'ARRAY_CONTAINS(t."targets", \'{db_hostname}/{db_name}\');')


async def delete_snk_ktable(db_hostname: str, db_name: str, db_table: str) -> Response:
    """Delete the database sink KSQL table.

    Returns:
        Response from the KSQL API.
    """
    kafka: Kafka = settings.KAFKA

    return await kafka.ksql.execute(F'DROP TABLE "replica_snk_{db_hostname}_{db_name}_{db_table}";')


# Connect
async def create_snk_connector(db_hostname: str, db_port: int, db_name: str,
    db_table: str, db_user: str, db_password: str) -> Response:
    """Create the database sink connector.

    Args:
        db_hostname: The sink database hostname.
        db_port: The sink database port.
        db_name: The sink database name.
        db_table: The sink database table.
        db_user: The sink database username.
        db_password: The sink database password.

    Returns:
        Response from the Kafka connect API.
    """
    kafka: Kafka = settings.KAFKA

    return await kafka.connector.create_connector(
        F'replica_snk_{db_hostname}_{db_name}_{db_table}', {
        'connector.class': 'io.confluent.connect.jdbc.JdbcSinkConnector',
        'topics': F'replica_snk_{db_hostname}_{db_name}_{db_table}',
        'connection.url': F'jdbc:postgresql://{db_hostname}:{db_port}/{db_name}',
        'connection.user': db_user,
        'connection.password': db_password,
        'key.converter': 'org.apache.kafka.connect.converters.IntegerConverter',
        'value.converter': 'io.confluent.connect.avro.AvroConverter',
        'value.converter.schemas.enabled': True,
        'value.converter.schema.registry.url': kafka.schema_registry.url,
        'tasks.max': '1',
        'auto.create': True,
        'auto.evolve': True,
        'delete.enabled': True,
        'insert.mode': 'upsert',
        'pk.mode': 'record_key',
        'pk.fields': 'acct_id',
        'continuum.topic': 'replica_status',
        'continuum.bootstrap.servers': kafka.brokers,
        'continuum.schema.registry.url': kafka.schema_registry.url,
        'continuum.label': F'{db_hostname}/{db_name}',
        'table.name.format': db_table,
    })


async def delete_snk_connector(db_hostname: str, db_name: str, db_table: str) -> Response:
    """Delete the database sink connector.

    Args:
        db_hostname: The sink database hostname.
        db_name: The sink database name.
        db_table: The sink database table.

    Returns:
        Response from the Kafka connect API.
    """
    kafka: Kafka = settings.KAFKA

    return await kafka.connector.delete_connector(
        F'replica_snk_{db_hostname}_{db_name}_{db_table}')


# Database Target ###################
# KSQL Table
async def create_db_trg_ktable() -> Response:
    """Create the database target KSQL table.

    Returns:
        Response from the KSQL API.
    """
    kafka: Kafka = settings.KAFKA

    return await kafka.ksql.execute(
        'CREATE TABLE "replica_trg_tbl" (' +
            '"acct_id" INT PRIMARY KEY,' +
            '"targets" ARRAY<VARCHAR>' +
        ') WITH (' +
            'PARTITIONS=1,' +
            'KAFKA_TOPIC=\'replica_trg\',' +
            'KEY_FORMAT=\'KAFKA\',' +
            'VALUE_FORMAT=\'AVRO\'' +
        ');')


async def delete_db_trg_ktable() -> Response:
    """Delete the database target KSQL table.

    Returns:
        Response from the KSQL API.
    """
    kafka: Kafka = settings.KAFKA

    return await kafka.ksql.execute('DROP TABLE "replica_trg_tbl";')


async def create_db_trg_ktable_queryable() -> Response:
    """Create the queryable database target KSQL table.

    Returns:
        Response from the KSQL API.
    """
    kafka: Kafka = settings.KAFKA

    return await kafka.ksql.execute(
        'CREATE TABLE "replica_trg_qtbl" AS SELECT * FROM "replica_trg_tbl";')


async def delete_db_trg_ktable_queryable() -> Response:
    """Delete the queryable database target KSQL table.

    Returns:
        Response from the KSQL API.
    """
    kafka: Kafka = settings.KAFKA

    return await kafka.ksql.execute('DROP TABLE "replica_trg_qtbl";')


# Database Target Account ###########
async def set_acct_trg(acct_id: int, targets: list) -> Response:
    """Insert a database target record into the database target KSQL table.

    Returns:
        Response from the KSQL API.
    """
    kafka: Kafka = settings.KAFKA

    if targets:
        targets_str = "'" + "','".join(targets) + "'"

        return await kafka.ksql.execute(
            F'INSERT INTO "replica_trg_tbl" ('
                '"acct_id","targets"'
            ') VALUES ('
                F'{acct_id},ARRAY[{targets_str}]'
            ');')

    return await kafka.ksql.execute(
        F'INSERT INTO "replica_trg_tbl" ('
            '"acct_id","targets"'
        ') VALUES ('
            F'{acct_id},NULL'
        ');')

