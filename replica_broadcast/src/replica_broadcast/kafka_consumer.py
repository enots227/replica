import json
from logging import Logger
from threading import Thread
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from confluent_kafka import KafkaError, KafkaException, Message
from confluent_kafka.deserializing_consumer import DeserializingConsumer
from confluent_kafka.error import ValueDeserializationError
from confluent_kafka.schema_registry import SchemaRegistryClient
from confluent_kafka.schema_registry.avro import AvroDeserializer
from confluent_kafka.serialization import StringDeserializer
from django.conf import settings


logger = Logger(__name__)


schema_registry_client = SchemaRegistryClient({
    'url': settings.KAFKA_API.schema_registry.url,
})
schema_str = json.dumps({
    'type': 'record',
    'name': 'replica_status_continuum',
    'namespace': 'io.confluent.connect.jdbc.continuum',
    'fields': [
        {
            'name': 'label',
            'type': 'string'
        },
        {
            'name': 'outcome',
            'type': 'int'
        },
        {
            'name': 'version',
            'type': [
                'null',
                'string'
            ],
            'default': None
        },
        {
            'name': 'updatedOn',
            'type': [
                'null',
                {
                    'type': 'long',
                    'logicalType': 'timestamp-millis'
                }
            ],
            'default': None
        }
    ]
})
avro_deserializer = AvroDeserializer(schema_registry_client, schema_str)
string_deserializer = StringDeserializer('utf_8')
consumer = DeserializingConsumer({
    'bootstrap.servers': settings.KAFKA_API.bootstrap_servers,
    'group.id': "replica_broadcast",
    'auto.offset.reset': 'earliest',
    'key.deserializer': string_deserializer,
    'value.deserializer': avro_deserializer,
})


def consume_loop(consumer, topics):
    try:
        consumer.subscribe(topics)
        channel_layer = get_channel_layer()

        while True:
            try:
                msg: Message = consumer.poll(timeout=1.0)
            except ValueDeserializationError:
                logger.warning("Message deserialization failed", extra={
                    'kafka_msg': msg })
                continue

            if msg is None:
                continue
            
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    # End of partition event
                    logger.warning('reached end at offset', extra={
                        'topic': msg.topic(),
                        'partition': msg.partition(),
                        'offset': msg.offset() })
                elif msg.error():
                    raise KafkaException(msg.error())
            else:
                try:
                    logger.info("processing message", extra={
                        'acct_id': msg.key() })

                    value = msg.value()                    

                    last_modified = None
                    
                    if value['updatedOn']:
                        last_modified = value['updatedOn'].isoformat()

                    async_to_sync(channel_layer.group_send)(
                        F"acct_{msg.key()}",
                        {
                            'type': 'acct_message',
                            'label': value['label'],
                            'outcome': value['outcome'],
                            'version': value['version'],
                            'updatedOn': last_modified,
                        }
                    )
                except TypeError:
                    logger.error('broadcast group does not exist, not '
                        'broadcasting', extra={ 'acct_id': msg.key() })
    except Exception:
        logger.fatal('Kafka consumer loop exiting unexpectedly!!', 
            exc_info=True)
    finally:
        # Close down consumer to commit final offsets.
        consumer.close()


def start_consumer():
    logger.info('Starting consumer')
    Thread(target=consume_loop, args=(consumer, ["replica_status"])).start()

