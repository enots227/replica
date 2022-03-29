"""Handles the web interface logic for accounts."""
from asgiref.sync import sync_to_async
from django.http import HttpRequest
from django.http.response import HttpResponse, JsonResponse
# from s4_django.errors import ValidationError
# from s4_django.views import AsyncView, json_deserialize
# from s4_django.log import S4Logger
from .serializers import AccountSerializer
from logging import Logger
import json
import asyncio
from django.views.generic import View
from django.utils.decorators import classonlymethod
from .models import create_account, list_accounts_sync, update_account, get_account, get_account_targets

# logger = S4Logger(__name__)
logger = Logger(__name__)


# Async Helpers
class AsyncView(View):
    """Base Async View."""

    # noinspection PyMethodParameters,PyProtectedMember
    @classonlymethod
    def as_view(cls, **kwargs):
        """Handles converting the class into an async view function."""
        view = super().as_view(**kwargs)
        # noinspection PyUnresolvedReferences
        view._is_coroutine = asyncio.coroutines._is_coroutine
        return view


class Accounts(AsyncView):
    """Handle operations on many accounts."""

    # noinspection PyMethodMayBeStatic
    async def post(self, request: HttpRequest) -> HttpResponse:
        """Create an account.

        Args:
            request: The Django web request.

        Returns:
             A JSON HTTP response with the newly created account.
        """
        serializer = AccountSerializer(
            data=json.loads(request.body) #json_deserialize(request.body)
        )
        serializer.is_valid()
        # if not serializer.is_valid():
        #     raise ValidationError(serializer.errors)

        account = await create_account(name=serializer.validated_data["name"])

        serializer = AccountSerializer(account)

        return JsonResponse({
            "account": serializer.data
        })

    # noinspection PyUnusedLocal
    @sync_to_async
    def get(self, request: HttpRequest) -> HttpResponse:
        """Get a list of accounts.

        Args:
            request: The Django web request.

        Returns:
             A JSON HTTP response with a list of accounts.
        """
        accounts = list_accounts_sync()

        serializer = AccountSerializer(accounts, many=True)

        return JsonResponse({
            "accounts": serializer.data
        }, safe=False)


class Account(AsyncView):
    """Handle operations on a single account."""

    # noinspection PyMethodMayBeStatic, PyUnusedLocal
    async def get(self, request: HttpRequest, account_id: int) -> HttpResponse:
        """Get an account.

        Args:
            request: The Django web request.
            account_id: The account ID.

        Returns:
             A JSON HTTP response with the account information.
        """
        account = await get_account(account_id)

        targets = await get_account_targets(account_id)

        serializer = AccountSerializer(account)

        return JsonResponse({
            "account": serializer.data,
            "targets": targets
        })

    # noinspection PyMethodMayBeStatic
    async def patch(self, request: HttpRequest, account_id: int) -> HttpResponse:
        """Update an account.

        Args:
            request: The Django web request.
            account_id: The account ID.

        Returns:
             A JSON HTTP response with the account information.
        """
        serializer = AccountSerializer(
            data=json.loads(request.body) #json_deserialize(request.body)
        )
        serializer.is_valid()
        # if not serializer.is_valid():
        #     raise ValidationError(serializer.errors)

        account = await update_account(account_id, **serializer.validated_data)

        serializer = AccountSerializer(account)

        return JsonResponse({
            "account": serializer.data
        })
