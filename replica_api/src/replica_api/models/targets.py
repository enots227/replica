from requests import Response
from st1_kafka_api import KafkaAPI


# KSQL Table
async def create_ktable(
    kafka: KafkaAPI,
) -> Response:
    """Create the data target KSQL table.

    Returns:
        Response from the KSQL API.
    """
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


async def delete_ktable(
    kafka: KafkaAPI,
) -> Response:
    """Delete the data target KSQL table.

    Returns:
        Response from the KSQL API.
    """
    return await kafka.ksql.execute('DROP TABLE "replica_trg_tbl";')


async def create_ktable_queryable(
    kafka: KafkaAPI,
) -> Response:
    """Create the queryable data target KSQL table.

    Returns:
        Response from the KSQL API.
    """
    return await kafka.ksql.execute(
        'CREATE TABLE "replica_trg_qtbl" AS SELECT * FROM "replica_trg_tbl";')


async def delete_ktable_queryable(
    kafka: KafkaAPI,
) -> Response:
    """Delete the queryable data target KSQL table.

    Returns:
        Response from the KSQL API.
    """
    return await kafka.ksql.execute('DROP TABLE "replica_trg_qtbl";')

