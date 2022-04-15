from requests import Response
from st1_kafka_api import KafkaAPI


# KSQL Table
async def create_ktable(
    kafka: KafkaAPI,
    db_hostname: str,
    db_name: str,
    db_table: str,
) -> Response:
    """Create the database sink KSQL table.

    Args:
        db_hostname: The sink database hostname.
        db_name: The sink database name.
        db_table: The sink database table.

    Returns:
        Response from the KSQL API.
    """
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


async def delete_ktable(
    kafka: KafkaAPI,
    db_hostname: str,
    db_name: str,
    db_table: str,
) -> Response:
    """Delete the database sink KSQL table.

    Returns:
        Response from the KSQL API.
    """
    return await kafka.ksql.execute(F'DROP TABLE "replica_snk_{db_hostname}_{db_name}_{db_table}";')


# Connect
async def create_connector(
    kafka: KafkaAPI,
    db_hostname: str,
    db_port: int,
    db_name: str,
    db_table: str,
    db_user: str,
    db_password: str,
) -> Response:
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
    return await kafka.connect.create_connector(
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
        'continuum.bootstrap.servers': kafka.bootstrap_servers,
        'continuum.schema.registry.url': kafka.schema_registry.url,
        'continuum.label': F'{db_hostname}/{db_name}',
        'continuum.version.column.name': 'last_change_id',
        'continuum.updatedOn.column.name': 'last_modified',
        'table.name.format': db_table,
    })


async def delete_connector(
    kafka: KafkaAPI,
    db_hostname: str,
    db_name: str,
    db_table: str,
) -> Response:
    """Delete the database sink connector.

    Args:
        db_hostname: The sink database hostname.
        db_name: The sink database name.
        db_table: The sink database table.

    Returns:
        Response from the Kafka connect API.
    """
    return await kafka.connect.delete_connector(
        F'replica_snk_{db_hostname}_{db_name}_{db_table}')

