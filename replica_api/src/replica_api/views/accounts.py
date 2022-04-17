from django.http import HttpRequest
from django.http.response import HttpResponse, JsonResponse
from django.urls import path
from django.conf import settings
from st1_django.utils import AsyncView, json_deserialize
from replica_api.models import accounts
from logging import Logger
logger = Logger(__name__)

# APIs ###################################
class Accts(AsyncView):
    """Handle operations on many accounts."""

    # noinspection PyMethodMayBeStatic
    async def post(self, request: HttpRequest) -> HttpResponse:
        """Create an account.

        Args:
            request: The Django web request.

        Returns:
             A JSON HTTP response with the newly created account.
        """
        data = accounts.create_account_schema(json_deserialize(request.body))

        async with settings.SQLALCHEMY_DATABASES.db_context() as db_session:
            acct = await accounts.create_account(db_session, **data)

        return JsonResponse({
            "account": {
                'id': acct.id,
                'name': acct.name,
            },
            "change": {
                'id': acct.last_change_id,
            } 
        })

    # # noinspection PyUnusedLocal
    async def get(self, request: HttpRequest) -> HttpResponse:
        """Get a list of accounts.

        Args:
            request: The Django web request.

        Returns:
             A JSON HTTP response with a list of accounts.
        """
        async with settings.SQLALCHEMY_DATABASES.db_context() as db_session:
            accts = await accounts.list_accounts(db_session)
            
        return JsonResponse({
            'accounts': [{
                'id': acct.id,
                'name': acct.name,
                'lastChange': {
                    'id': acct.last_change_id,
                    'on': f'{acct.last_modified}Z',
                },
            } for acct in accts]
        })


class Acct(AsyncView):
    """Handle operations on a single account."""

    # noinspection PyMethodMayBeStatic, PyUnusedLocal
    async def get(self, request: HttpRequest, acct_id: int) -> HttpResponse:
        """Get an account.

        Args:
            request: The Django web request.
            acct_id: The account ID.

        Returns:
             A JSON HTTP response with the account information.
        """
        async with settings.SQLALCHEMY_DATABASES.db_context() as db_session:
            acct = await accounts.get_account(db_session, acct_id)

        trgs = await accounts.get_trg(settings.KAFKA_API, acct_id)
        
        return JsonResponse({
            'account': {
                'id': acct.id,
                'name': acct.name,
                'lastChange': {
                    'id': acct.last_change_id,
                    'on': F'{acct.last_modified}Z',
                },
            },
            "targets": trgs,
        })

    # noinspection PyMethodMayBeStatic
    async def patch(self, request: HttpRequest, acct_id: int) -> HttpResponse:
        """Update an account.

        Args:
            request: The Django web request.
            account_id: The account ID.

        Returns:
             A JSON HTTP response with the account information.
        """
        data = accounts.update_account_schema(json_deserialize(request.body))

        async with settings.SQLALCHEMY_DATABASES.db_context() as db_session:
            acct = await accounts.update_account(db_session,
                acct_id, **data)

        return JsonResponse({
            'account': {
                'id': acct.id,
                'name': acct.name,
            },
            "change": {
                'id': acct.last_change_id,
                'on': f'{acct.last_modified}Z',
            },
        })


# Data Targets #####
class AcctTarget(AsyncView):
    """Handle insert data into the target ktable."""

    async def post(self, request: HttpRequest, acct_id: int) -> HttpResponse:
        targets = accounts.set_targets_schema(json_deserialize(request.body))['targets']

        resp = await accounts.set_trg(settings.KAFKA_API, acct_id=acct_id,
            targets=targets)

        return HttpResponse(resp.content.decode('UTF-8'),
            status=resp.status_code, content_type='application/json')


# URLs #################################
v1 = [
    path('', Accts.as_view()),
    path('<int:acct_id>/', Acct.as_view()),
    path('<int:acct_id>/trg/', AcctTarget.as_view()),
]

