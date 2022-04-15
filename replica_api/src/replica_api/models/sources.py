from requests import Response
from st1_kafka_api import KafkaAPI


# Schema Registery
async def create_schema(
    kafka: KafkaAPI,
) -> Response:
    """Create the database source schema.

    Returns:
        Response from the Kafka Confluent Schema Registry API.
    """
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
async def create_ktable(
    kafka: KafkaAPI,
) -> Response:
    """Create the database source KSQL table.

    Returns:
        Response from the KSQL API.
    """
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


async def delete_ktable(
    kafka: KafkaAPI,
) -> Response:
    """Delete the database source KSQL table.

    Returns:
        Response from the KSQL API.
    """
    return await kafka.ksql.execute('DROP TABLE "replica_src_account";')


# Connect
async def create_connector(
    kafka: KafkaAPI,
    db_hostname: str,
    db_port: int,
    db_name: str, 
    db_user: str,
    db_password: str,
    poll_interval: int
) -> Response:
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
    return await kafka.connect.create_connector('replica_src', {
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
        'continuum.bootstrap.servers': kafka.bootstrap_servers,
        'continuum.schema.registry.url': kafka.schema_registry.url,
        'continuum.label': 'replica_src',
        'continuum.version.column.name': 'last_change_id',
        'continuum.updatedOn.column.name': 'last_modified',
        'poll.interval.ms': poll_interval,
    })


async def delete_connector(
    kafka: KafkaAPI,
) -> Response:
    """Delete the database source connector.

    Returns:
        Response from the Kafka connect API.
    """
    return await kafka.connect.delete_connector('replica_src')

