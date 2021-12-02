from typing import Tuple
import requests
import json
from django.conf import settings
from s4_django.log import S4Logger

logger = S4Logger(__name__)


def normalize_resp(resp) -> dict:
    content = None

    if hasattr(resp, 'text'):
        try:
            content = json.loads(resp.text)
        except ValueError:
            content = resp.text

    return {
        'resp.status_code': resp.status_code,
        'resp.reason': resp.reason,
        'resp.text': content,
    }


def exists_ktable(nrom_resp: dict) -> bool:
    return nrom_resp['resp.status_code'] == 400 and \
        isinstance(nrom_resp['resp.text'], dict) and \
        'message' in nrom_resp['resp.text'] and \
        'already exists' in nrom_resp['resp.text']['message']


def create_source_connector(
    database_hostname: str,
    database_port: int,
    database_username: str,
    database_password: str,
    topic_prefix: str,
    continuum_topic: str,
 ) -> Tuple[bool, dict]:
    url = F'http://{settings.KAFKA_CONNECT}/connectors'
    payload = {
        'name': 'replica_source',
        'config': {
            'connector.class': 'io.confluent.connect.jdbc.JdbcSourceConnector',
            'connection.url': F'jdbc:postgresql://{database_hostname}:{database_port}/source',
            'connection.user': database_username,
            'connection.password': database_password,
            'topic.prefix': topic_prefix,
            'poll.interval.ms' : 500, # 3600000,
            'table.whitelist' : 'public.account',
            'mode':'timestamp+incrementing',
            'timestamp.column.name': 'last_modified',
            'incrementing.column.name': 'acct_id',
            'transforms':'createKey,extractInt',
            'transforms.createKey.type':'org.apache.kafka.connect.transforms.ValueToKey',
            'transforms.createKey.fields':'acct_id',
            'transforms.extractInt.type':'org.apache.kafka.connect.transforms.ExtractField$Key',
            'transforms.extractInt.field':'acct_id',
            'key.converter': 'org.apache.kafka.connect.converters.IntegerConverter',
            'value.converter': 'io.confluent.connect.avro.AvroConverter',
            'value.converter.schema.registry.url': settings.KAFKA_SCHEMA_REGISTRY,
            'continuum.topic': continuum_topic,
            'continuum.bootstrap.servers': settings.KAFKA_BROKERS,
            'continuum.schema.registry.url': settings.KAFKA_SCHEMA_REGISTRY,
            'continuum.label': 'replica_source',
        }
    }

    logger.info(3140, 'Kafka source connector creation request', log_data={
        'url': url,
        'payload': payload
    })

    resp = requests.post(url, json = payload)

    norm_resp = normalize_resp(resp)
    success = False

    if resp.status_code == 201:
        logger.info(3141, 'successfully created Kafka source connector', log_data=norm_resp)
        success = True
    elif resp.status_code == 409:
        logger.info(3143, F'Kafka source connector already exists', log_data=norm_resp)
        success = True
    else:
        logger.error(3142, 'failed to create Kafka source connector', log_data=norm_resp)

    return success, norm_resp


def create_source_ktable(
    topic_prefix: str,
 ) -> dict:
    url = F'http://{settings.KSQL}/ksql'
    payload = {
        'ksql': 
            'CREATE TABLE replica_acct_tbl (' \
                'acct_id INT PRIMARY KEY,' \
                'name STRING,' \
                'last_change_id BIGINT,' \
                'last_modified BIGINT' \
            ') WITH (' \
                F'KAFKA_TOPIC=\'{topic_prefix}account\',' \
                'KEY_FORMAT=\'KAFKA\',' \
                'VALUE_FORMAT=\'AVRO\'' \
            ');',
        'streamsProperties': {}
    }

    logger.info(3142, 'KSQL ktable replica_acct_tbl creation request', log_data={
        'url': url,
        'payload': payload
    })

    resp = requests.post(url, json = payload)

    norm_resp = normalize_resp(resp)
    success = False

    if resp.status_code == 200:
        logger.info(3143, 'successfully created ktable replica_acct_tbl', log_data=norm_resp)
        success = True
    elif exists_ktable(norm_resp):
        logger.info(3143, F'ktable replica_acct_tbl already exists', log_data=norm_resp)
        success = True
    else:
        logger.error(3144, 'failed to create ktable replica_acct_tbl', log_data=norm_resp)
    
    return success, norm_resp


def create_sink_ktable(
    name: str,
    db_id: int
 ) -> Tuple[bool, dict]:
    url = F'http://{settings.KSQL}/ksql'
    payload = {
        'ksql': 
            F'CREATE TABLE {name}_account AS SELECT ' \
                'a.ACCT_ID AS KEY,' \
                'AS_VALUE(a.ACCT_ID) AS "acct_id",' \
                'a.NAME AS "name",' \
                'a.LAST_CHANGE_ID AS "last_change_id",' \
                'a.LAST_MODIFIED AS "last_modified" ' \
            'FROM replica_trg_tbl AS t ' \
            'INNER JOIN replica_acct_tbl AS a ON a.acct_id = t.acct_id ' \
            'WHERE ' \
                F'ARRAY_CONTAINS(t.targets, \'{db_id}\')' \
            ';',
        'streamsProperties': {}
    }

    logger.info(3142, F'KSQL ktable {name}_account creation request', log_data={
        'url': url,
        'payload': payload
    })

    resp = requests.post(url, json = payload)

    norm_resp = normalize_resp(resp)
    success = False

    if resp.status_code == 200:
        logger.info(3143, F'successfully created ktable {name}_account', log_data=norm_resp)
        success = True
    elif exists_ktable(norm_resp):
        logger.info(3143, 'ktable {name}_account already exists', log_data=norm_resp)
        success = True
    else:
        logger.error(3144, F'failed to create ktable {name}_account', log_data=norm_resp)
    
    return success, norm_resp


def create_sink_connector(
    name: str,
    database_hostname: str,
    database_port: int,
    database_name: str,
    database_username: str,
    database_password: str,
    poll_interval: int,
    continuum_topic: str,
 ) -> Tuple[bool, dict]:
    url = F'http://{settings.KAFKA_CONNECT}/connectors'
    payload = {
        'name': name,
        'config': {
            'connector.class': 'io.confluent.connect.jdbc.JdbcSinkConnector',
            'topics': F'{name.upper()}_ACCOUNT',
            'connection.url': F"jdbc:postgresql://{database_hostname}:{database_port}/{database_name}",
            'connection.user': database_username,
            'connection.password': database_password,
            'key.converter': 'org.apache.kafka.connect.converters.IntegerConverter',
            'value.converter': 'io.confluent.connect.avro.AvroConverter',
            'value.converter.schemas.enabled': True,
            'value.converter.schema.registry.url': settings.KAFKA_SCHEMA_REGISTRY,
            'tasks.max':'1',
            'auto.create': True,
            'auto.evolve': True,
            'delete.enabled': True,
            'insert.mode': 'upsert',
            'pk.mode': 'record_key',
            'pk.fields': 'acct_id',
            'poll.interval.ms' : poll_interval,
            'continuum.topic': continuum_topic,
            'continuum.bootstrap.servers': settings.KAFKA_BROKERS,
            'continuum.schema.registry.url': settings.KAFKA_SCHEMA_REGISTRY,
            'continuum.label': F'{database_hostname}/{database_name}',
            'table.name.format': 'account',
        }
    }

    logger.info(3140, F'Kafka sink connector {name}_account creation request', log_data={
        'url': url,
        'payload': payload
    })

    resp = requests.post(url, json = payload)

    norm_resp = normalize_resp(resp)
    success = False
    
    if resp.status_code == 201:
        logger.info(3141, F'successfully created Kafka sink connector {name}_account', log_data=norm_resp)
        success = True
    elif resp.status_code == 409:
        logger.info(3143, F'Kafka sink connector {name}_account already exists', log_data=norm_resp)
        success = True
    else:
        logger.error(3142, F'failed to create Kafka sink connector {name}_account', log_data=norm_resp)

    return success, norm_resp


def create_target_ktable() -> Tuple[bool, dict]:
    url = F'http://{settings.KSQL}/ksql'
    payload = {
        'ksql': 
            F'CREATE TABLE replica_trg_tbl (' \
                'acct_id INT PRIMARY KEY,' \
                'targets ARRAY<VARCHAR>' \
            ') WITH (' \
                'PARTITIONS=1,' \
                'KAFKA_TOPIC=\'replica_targets\',' \
                'KEY_FORMAT=\'KAFKA\',' \
                'VALUE_FORMAT=\'AVRO\'' \
            ');',
        'streamsProperties': {}
    }

    logger.info(3142, F'KSQL ktable replica_trg_tbl creation request', log_data={
        'url': url,
        'payload': payload
    })

    resp = requests.post(url, json = payload)

    norm_resp = normalize_resp(resp)
    success = False

    if resp.status_code == 200:
        logger.info(3143, F'successfully created ktable replica_trg_tbl', log_data=norm_resp)
        success = True
    elif exists_ktable(norm_resp):
        logger.info(3143, F'ktable replica_trg_tbl already exists', log_data=norm_resp)
        success = True
    else:
        logger.error(3144, F'failed to create ktable replica_trg_tbl', log_data=norm_resp)
    
    return success, norm_resp


def create_target(
    acct_id: int,
    targets: list
 ) -> Tuple[bool, dict]:
    url = F'http://{settings.KSQL}/ksql'

    targets_str = "'" + "','".join(targets) + "'"

    payload = {
        'ksql': 
            F'INSERT INTO replica_trg_tbl (' \
                'acct_id,' \
                'targets' \
            ') VALUES (' \
                F'{acct_id},' \
                F'ARRAY[{targets_str}]' \
            ');',
        'streamsProperties': {}
    }

    logger.info(3142, F'KSQL insert into ktable replica_trg_tbl request', log_data={
        'url': url,
        'payload': payload
    })

    resp = requests.post(url, json = payload)

    norm_resp = normalize_resp(resp)
    success = False

    if resp.status_code == 200:
        logger.info(3143, F'successfully insert into ktable replica_trg_tbl', log_data=norm_resp)
        success = True
    else:
        logger.error(3144, F'failed to insert into ktable replica_trg_tbl', log_data=norm_resp)
    
    return success, norm_resp


def create_target_ktable_querable() -> Tuple[bool, dict]:
    url = F'http://{settings.KSQL}/ksql'
    payload = {
        'ksql': 'CREATE TABLE QUERYABLE_REPLICA_TRG_TBL AS SELECT * FROM REPLICA_TRG_TBL;',
        'streamsProperties': {}
    }

    logger.info(3142, F'KSQL ktable QUERYABLE_REPLICA_TRG_TBL creation request', log_data={
        'url': url,
        'payload': payload
    })

    resp = requests.post(url, json = payload)

    norm_resp = normalize_resp(resp)
    success = False

    if resp.status_code == 200:
        logger.info(3143, F'successfully created ktable QUERYABLE_REPLICA_TRG_TBL', log_data=norm_resp)
        success = True
    elif exists_ktable(norm_resp):
        logger.info(3143, F'ktable QUERYABLE_REPLICA_TRG_TBL already exists', log_data=norm_resp)
        success = True
    else:
        logger.error(3144, F'failed to create ktable QUERYABLE_REPLICA_TRG_TBL', log_data=norm_resp)
    
    return success, norm_resp

