from asgiref.sync import sync_to_async
from django.http.response import HttpResponse, JsonResponse
from rest_framework import serializers
from s4_django.errors import FriendlyError, ValidationError
from s4_django.views import AsyncView, json_deserialize
from s4_django.log import S4Logger
from .serializers import AccountSerializer
from .models import create_account, list_accounts_sync, update_account, get_account, get_account_targets

logger = S4Logger(__name__)

class Accounts(AsyncView):
    """Handle operations on one access record."""

    async def post(self, request) -> HttpResponse:
        """Gets a single access record and return it to the requester.

        Args:
            request: The Django web request.
            key: The Redis JWT key located in the URL path.

        Returns:
             A JSON HTTP response with the access record (omitting the secret).
        """
        serializer = AccountSerializer(
            data=json_deserialize(request.body)
        )

        if not serializer.is_valid():
            raise ValidationError(serializer.errors)

        account = await create_account(name=serializer.validated_data["name"])

        serializer = AccountSerializer(account)

        return JsonResponse({ "account": serializer.data })

    @sync_to_async
    def get(self, request) -> HttpResponse:
        accounts = list_accounts_sync()

        serializer = AccountSerializer(accounts, many=True)

        return JsonResponse({
            "accounts": serializer.data
        }, safe=False)


class Account(AsyncView):
    """Handle operations on one access record."""

    async def get(self, request, id) -> HttpResponse:
        account = await get_account(id)

        targets = get_account_targets(id)

        serializer = AccountSerializer(account)

        return JsonResponse({ "account": serializer.data, "targets": targets })

    async def patch(self, request, id) -> HttpResponse:
        """Gets a single access record and return it to the requester.

        Args:
            request: The Django web request.
            key: The Redis JWT key located in the URL path.

        Returns:
             A JSON HTTP response with the access record (omitting the secret).
        """
        serializer = AccountSerializer(
            data=json_deserialize(request.body)
        )

        if not serializer.is_valid():
            raise ValidationError(serializer.errors)

        account = await update_account(id, **serializer.validated_data)

        serializer = AccountSerializer(account)

        return JsonResponse({ "account": serializer.data })

