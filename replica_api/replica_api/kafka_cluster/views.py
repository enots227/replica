import requests
import json
from django.http.response import HttpResponse, JsonResponse
from s4_django.views import AsyncView
from s4_django.log import S4Logger
import os

from .models import *

logger = S4Logger(__name__)


class KafkaSetupSource(AsyncView):
    """Handle configuring the source connector and source ktable."""

    async def post(self, request) -> HttpResponse:
        data = json.loads(request.body)

        topic_prefix = os.environ.get('SOURCE_TOPIC_PREFIX')

        success, source_connector = create_source_connector(
            database_hostname=data['database_hostname'],
            database_port=data['database_port'],
            database_username=data['database_username'],
            database_password=data['database_password'],
            topic_prefix=topic_prefix,
            continuum_topic=os.environ.get('CONTINUUM_TOPIC'),
        )

        if success:
            success, source_ktable = create_source_ktable(
                topic_prefix=topic_prefix,
            )

            return JsonResponse({
                'source_connector': source_connector,
                'source_ktable': source_ktable,
            }, status=source_ktable['resp.status_code'] if not success else 200)

        return JsonResponse({
            'source_connector': source_connector,
            'source_ktable': None,
        }, status=source_connector['resp.status_code'])
        
    
class KafkaSetupTarget(AsyncView):
    """Handle configuring the target ktable."""

    async def post(self, request) -> HttpResponse:       
        success, trg_ktable = create_target_ktable()

        if success:
            success, trg_ktable_querable = create_target_ktable_querable()

            return JsonResponse({
                'trg_ktable': trg_ktable,
                'trg_ktable_querable': trg_ktable_querable,
            }, status=trg_ktable_querable['resp.status_code'] if not success else 200)

        return JsonResponse({
            'trg_ktable': trg_ktable,
            'trg_ktable_querable': None,
        }, status=trg_ktable['resp.status_code'])


class KafkaAcctTarget(AsyncView):
    """Handle insert data into the target ktable."""

    async def post(self, request) -> HttpResponse:
        data = json.loads(request.body)

        success, trg_insert = create_target(
            acct_id=data['acct_id'],
            targets=data['targets']
        )

        return JsonResponse({
            'trg_insert': trg_insert,
        }, status=trg_insert['resp.status_code'] if not success else 200)


class KafkaSetupSink(AsyncView):
    """Handle configuring the sink connector and sink ktable."""

    async def post(self, request) -> HttpResponse:
        data = json.loads(request.body)
        name = F"replica_{data['database_hostname']}_{data['database_name']}"

        success, sink_ktable = create_sink_ktable(
            name=name,
            db_id=F"{data['database_hostname']}/{data['database_name']}",
        )

        if success:
            success, sink_connector = create_sink_connector(
                name=name,
                database_hostname=data['database_hostname'],
                database_port=data['database_port'],
                database_name=data['database_name'],
                database_username=data['database_username'],
                database_password=data['database_password'],
                poll_interval=data['poll_interval'],
                continuum_topic=os.environ.get('CONTINUUM_TOPIC'),
            )

            return JsonResponse({
                'sink_connector': sink_connector,
                'sink_ktable': sink_ktable,
            }, status=sink_connector['resp.status_code'] if not success else 200)

        return JsonResponse({
            'sink_connector': None,
            'sink_ktable': sink_ktable,
        }, status=sink_ktable['resp.status_code'])
