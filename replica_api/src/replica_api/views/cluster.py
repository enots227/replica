from django.http import HttpRequest
from django.http.response import HttpResponse, JsonResponse
from django.urls import path
from django.conf import settings
from st1_django.utils import AsyncView, json_deserialize
from replica_api.models import sources, sinks, targets


def json_bytes(content: bytes, status: int) -> HttpResponse:
    return HttpResponse(content.decode('UTF-8'), status=status,
        content_type='application/json')


# APIs ###################################
class Connectors(AsyncView):
    """Handle configuring the source connector and source ktable."""

    # noinspection PyMethodMayBeStatic
    async def get(self, request: HttpRequest) -> HttpResponse:
        resp = await settings.KAFKA_API.connect.get_connectors()

        return json_bytes(resp.content, status=resp.status_code)


# Source ###########
class SourceSchemaRegistry(AsyncView):
    """Handle configuring the source connector and source ktable."""

    async def post(self, request: HttpRequest) -> HttpResponse:
        resp = await sources.create_schema(settings.KAFKA_API)
        
        return json_bytes(resp.content, status=resp.status_code)


class SourceKTable(AsyncView):
    """Handle configuring the source connector and source ktable."""

    async def post(self, request: HttpRequest) -> HttpResponse:
        resp = await sources.create_ktable(settings.KAFKA_API)
        
        return json_bytes(resp.content, status=resp.status_code)

    async def delete(self, request: HttpRequest) -> HttpResponse:
        resp = await sources.delete_ktable(settings.KAFKA_API)
        
        return json_bytes(resp.content, status=resp.status_code)


class SourceConnector(AsyncView):
    """Handle configuring the source connector and source ktable."""

    async def post(self, request: HttpRequest) -> HttpResponse:
        data = json_deserialize(request.body)

        resp = await sources.create_connector(settings.KAFKA_API, **data)
        
        return json_bytes(resp.content, status=resp.status_code)

    async def delete(self, request: HttpRequest) -> HttpResponse:
        resp = await sources.delete_connector(settings.KAFKA_API)
        
        return json_bytes(resp.content, status=resp.status_code)


# Sink #############
class SinkKTables(AsyncView):
    """Handle configuring the source connector and source ktable."""

    async def post(self, request: HttpRequest) -> HttpResponse:
        data = json_deserialize(request.body)

        resp = await sinks.create_ktable(settings.KAFKA_API, **data)
        
        return json_bytes(resp.content, status=resp.status_code)

    async def delete(self, request: HttpRequest) -> HttpResponse:
        data = json_deserialize(request.body)

        resp = await sinks.delete_ktable(settings.KAFKA_API, **data)
        
        return json_bytes(resp.content, status=resp.status_code)


class SinkConnectors(AsyncView):
    """Handle configuring the source connector and source ktable."""

    async def post(self, request: HttpRequest) -> HttpResponse:
        data = json_deserialize(request.body)

        resp = await sinks.create_connector(settings.KAFKA_API, **data)

        return json_bytes(resp.content, status=resp.status_code)

    async def delete(self, request: HttpRequest) -> HttpResponse:
        data = json_deserialize(request.body)

        resp = await sinks.delete_connector(settings.KAFKA_API, **data)
        
        return json_bytes(resp.content, status=resp.status_code)


# Targets ##########
class TargetKTable(AsyncView):
    """Handle configuring the source connector and source ktable."""

    async def post(self, request: HttpRequest) -> HttpResponse:
        resp = await targets.create_ktable(settings.KAFKA_API)
        
        return json_bytes(resp.content, status=resp.status_code)

    async def delete(self, request: HttpRequest) -> HttpResponse:
        resp = await targets.delete_ktable(settings.KAFKA_API)
        
        return json_bytes(resp.content, status=resp.status_code)


class TargetKTableQueryable(AsyncView):
    """Handle configuring the source connector and source ktable."""

    async def post(self, request: HttpRequest) -> HttpResponse:
        resp = await targets.create_ktable_queryable(settings.KAFKA_API)
        
        return json_bytes(resp.content, status=resp.status_code)

    async def delete(self, request: HttpRequest) -> HttpResponse:
        resp = await targets.delete_ktable_queryable(settings.KAFKA_API)
        
        return json_bytes(resp.content, status=resp.status_code)


# URLs #################################
v1 = [
    path('connectors/', Connectors.as_view()),
    path('src/schema-registry/', SourceSchemaRegistry.as_view()),
    path('src/ktable/', SourceKTable.as_view()),
    path('src/connector/', SourceConnector.as_view()),
    path('snk/ktables/', SinkKTables.as_view()),
    path('snk/connectors/', SinkConnectors.as_view()),
    path('trg/ktable/', TargetKTable.as_view()),
    path('trg/ktable-queryable/', TargetKTableQueryable.as_view()),
]

