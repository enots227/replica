from threading import Thread
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from confluent_kafka import KafkaError, KafkaException, Message
from confluent_kafka.deserializing_consumer import DeserializingConsumer
from confluent_kafka.error import ValueDeserializationError
from confluent_kafka.schema_registry import SchemaRegistryClient
from confluent_kafka.schema_registry.avro import AvroDeserializer
from confluent_kafka.serialization import StringDeserializer
from s4_django.log import S4Logger
from django.conf import settings

logger = S4Logger(__name__)


schema_registry_client = SchemaRegistryClient({
    'url': settings.KAFKA_SCHEMA_REGISTRY,
})

schema_str = """
{
    "type":"record",
    "name":"replica_status_continuum",
    "namespace": "io.confluent.connect.jdbc.continuum",
    "fields":[
        {"name":"target","type":"string"},
        {"name":"statusCode","type":"int"}
    ]
}
"""
avro_deserializer = AvroDeserializer(schema_registry_client, schema_str)
string_deserializer = StringDeserializer('utf_8')
consumer = DeserializingConsumer({
    'bootstrap.servers': settings.KAFKA_BROKERS,
    'group.id': "replica_broadcast",
    'auto.offset.reset': 'earliest',
    'key.deserializer': string_deserializer,
    'value.deserializer': avro_deserializer,
})


def consume_loop(consumer, topics):
    try:
        consumer.subscribe(topics)
        channel_layer = get_channel_layer()
        logger.info(2, F"SUBSCRIBED to {topics}")
        while True:
            try:
                msg: Message = consumer.poll(timeout=1.0)
            except ValueDeserializationError as e:
                logger.warning(msgid=2, msg=F"Message deserialization failed for {msg}: {e}")
                continue

            if msg is None:
                #logger.info(msgid=2, msg="EMPTY RAN")
                continue
            
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    # End of partition event
                    logger.warning(msgid=45, msg='%% %s [%d] reached end at offset %d\n' %
                           (msg.topic(), msg.partition(), msg.offset()))
                elif msg.error():
                    raise KafkaException(msg.error())
            else:
                pass
                logger.warning(msgid=245, msg="process message")
                try:
                    value = msg.value()
                    async_to_sync(channel_layer.group_send)(
                        F"chat_{msg.key()}",
                        {'type': 'chat_message', 'target': value['target'], 'statusCode': value['statusCode'] }
                    )
                except TypeError:
                    logger.warning(245, F"the group chat_{msg.key()} does not exist, not broadcasting")

                # msg_process(msg)
    finally:
        # Close down consumer to commit final offsets.
        consumer.close()

def start_consumer():
    logger.info(2, "Starting consumer")
    Thread(target=consume_loop, args=(consumer, ["replica_status"])).start()
