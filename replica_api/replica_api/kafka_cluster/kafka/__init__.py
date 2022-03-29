from .connector import KafkaConnector
from .ksql import KafkaKSQL
from .schema_registry import KafkaSchemaRegistry


class Kafka:

    def __init__(self,
        brokers: str = '',
        connector: KafkaConnector=None,
        ksql: KafkaKSQL=None,
        schema_registry: KafkaSchemaRegistry=None
    ):
        self.brokers = brokers
        self.connector = connector
        self.ksql = ksql
        self.schema_registry = schema_registry

