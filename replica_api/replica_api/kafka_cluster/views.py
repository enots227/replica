"""Handles the web interface logic for Kafka configuration ."""
import json
from django.http import HttpRequest
from django.http.response import HttpResponse, JsonResponse
# from s4_django.views import AsyncView
from accounts.views import AsyncView
from logging import Logger

from kafka_cluster.models import *
from kafka_cluster.kafka import Kafka

from .modelsOld import *


logger = Logger(__name__)


# All ###########################
class KafkaConnectors(AsyncView):
    """Handle configuring the source connector and source ktable."""

    # noinspection PyMethodMayBeStatic
    async def get(self, request: HttpRequest) -> HttpResponse:
        kafka: Kafka = settings.KAFKA

        resp = await kafka.connector.get_connectors()

        return HttpResponse(resp.content, status=resp.status_code,
            content_type='application/json')


# Source ########################
class KafkaSourceSchemaRegistry(AsyncView):
    """Handle configuring the source connector and source ktable."""

    # noinspection PyMethodMayBeStatic
    async def post(self, request: HttpRequest) -> HttpResponse:
        resp = await create_src_schema()
        
        return HttpResponse(resp.content, status=resp.status_code,
            content_type='application/json')


class KafkaSourceKTable(AsyncView):
    """Handle configuring the source connector and source ktable."""

    # noinspection PyMethodMayBeStatic
    async def post(self, request: HttpRequest) -> HttpResponse:
        resp = await create_src_ktable()
        
        return HttpResponse(resp.content, status=resp.status_code,
            content_type='application/json')

    # noinspection PyMethodMayBeStatic
    async def delete(self, request: HttpRequest) -> HttpResponse:
        resp = await delete_src_ktable()
        
        return HttpResponse(resp.content, status=resp.status_code,
            content_type='application/json')


class KafkaSourceConnector(AsyncView):
    """Handle configuring the source connector and source ktable."""

    # noinspection PyMethodMayBeStatic
    async def post(self, request: HttpRequest) -> HttpResponse:
        data = json.loads(request.body)

        resp = await create_src_connector(**data)
        
        return HttpResponse(resp.content, status=resp.status_code,
            content_type='application/json')

    # noinspection PyMethodMayBeStatic
    async def delete(self, request: HttpRequest) -> HttpResponse:
        resp = await delete_src_connector()
        
        return HttpResponse(resp.content, status=resp.status_code,
            content_type='application/json')


# Sink ##########################
class KafkaSinkKTable(AsyncView):
    """Handle configuring the source connector and source ktable."""

    # noinspection PyMethodMayBeStatic
    async def post(self, request: HttpRequest) -> HttpResponse:
        data = json.loads(request.body)

        resp = await create_snk_ktable(**data)
        
        return HttpResponse(resp.content, status=resp.status_code,
            content_type='application/json')

    # noinspection PyMethodMayBeStatic
    async def delete(self, request: HttpRequest) -> HttpResponse:
        data = json.loads(request.body)

        resp = await delete_snk_ktable(**data)
        
        return HttpResponse(resp.content, status=resp.status_code,
            content_type='application/json')


class KafkaSinkConnector(AsyncView):
    """Handle configuring the source connector and source ktable."""

    # noinspection PyMethodMayBeStatic
    async def post(self, request: HttpRequest) -> HttpResponse:
        data = json.loads(request.body)

        resp = await create_snk_connector(**data)
        
        return HttpResponse(resp.content, status=resp.status_code,
            content_type='application/json')

    # noinspection PyMethodMayBeStatic
    async def delete(self, request: HttpRequest) -> HttpResponse:
        data = json.loads(request.body)

        resp = await delete_snk_connector(**data)
        
        return HttpResponse(resp.content, status=resp.status_code,
            content_type='application/json')


# Database Target ###############
class KafkaDBTargetKTable(AsyncView):
    """Handle configuring the source connector and source ktable."""

    # noinspection PyMethodMayBeStatic
    async def post(self, request: HttpRequest) -> HttpResponse:
        resp = await create_db_trg_ktable()
        
        return HttpResponse(resp.content, status=resp.status_code,
            content_type='application/json')

    # noinspection PyMethodMayBeStatic
    async def delete(self, request: HttpRequest) -> HttpResponse:
        resp = await delete_db_trg_ktable()
        
        return HttpResponse(resp.content, status=resp.status_code,
            content_type='application/json')


class KafkaDBTargetKTableQueryable(AsyncView):
    """Handle configuring the source connector and source ktable."""

    # noinspection PyMethodMayBeStatic
    async def post(self, request: HttpRequest) -> HttpResponse:
        resp = await create_db_trg_ktable_queryable()
        
        return HttpResponse(resp.content, status=resp.status_code,
            content_type='application/json')

    # noinspection PyMethodMayBeStatic
    async def delete(self, request: HttpRequest) -> HttpResponse:
        resp = await delete_db_trg_ktable_queryable()
        
        return HttpResponse(resp.content, status=resp.status_code,
            content_type='application/json')


# Database Target Account #######
class KafkaAcctTarget(AsyncView):
    """Handle insert data into the target ktable."""

    # noinspection PyMethodMayBeStatic
    async def post(self, request) -> HttpResponse:
        data = json.loads(request.body)

        resp = await set_acct_trg(**data)

        return HttpResponse(resp.content, status=resp.status_code,
            content_type='application/json')

