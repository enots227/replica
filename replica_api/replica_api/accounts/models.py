"""Handles the business logic for accounts."""
import requests
import json
from django.utils.timezone import now
from django.db import models, transaction
from asgiref.sync import sync_to_async
from django.db.models.query import QuerySet
from django.conf import settings
from logging import Logger

logger = Logger(__name__)


class AccountChange(models.Model):
    """A database table containing entries tracking account record changes."""

    class Meta:
        db_table = "account_change"

    change_id = models.BigAutoField(db_column="change_id", primary_key=True)
    account_id = models.BigIntegerField(db_column="account_id")


class Account(models.Model):
    """A database table containing account information."""

    class Meta:
        db_table = "account"

    id = models.BigAutoField(db_column="acct_id", primary_key=True)
    name = models.TextField(max_length=200, db_column="name")
    last_change_id = models.BigIntegerField(db_column="last_change_id")
    last_modified = models.DateTimeField(db_column="last_modified", auto_now=True)


@sync_to_async
@transaction.atomic
def create_account(name: str = "") -> Account:
    """Create a new account.

    Args:
        name: An example property for an account.

    Returns:
        The account record newly created.
    """
    account_change = AccountChange(account_id=None)
    account_change.save()

    account = Account(name=name, last_change_id=account_change.change_id)
    account.save()

    account_change.account_id = account.id
    account_change.save()

    return account


def list_accounts_sync() -> QuerySet:
    """List all accounts."""
    return Account.objects.all()


list_accounts = sync_to_async(list_accounts_sync)


def get_account_sync(account_id: int) -> QuerySet:
    """Get a single account.

    Args:
        account_id: The account ID.

    Returns:
        An account record.
    """
    return Account.objects.get(id=account_id)


get_account = sync_to_async(get_account_sync)


@sync_to_async
def update_account(account_id: int, **account_data: dict) -> Account:
    """Update a single account.

    Args:
        account_id: The account ID to update.
        account_data: One or more properties to update.

    Returns:
        An account record.
    """
    account_change = AccountChange(account_id=account_id)
    account_change.save()

    account = Account.objects.get(id=account_id)
    account.last_change_id = account_change.change_id
    account.last_modified = now()

    for key, value in account_data.items():
        setattr(account, key, value)

    account.save()

    return account


async def get_account_targets(account_id: int) -> list:
    """Get database targets from the queryable KSQL table.

    Args:
        account_id: The account ID.

    Returns:
        The database targets for the account.
    """
    kafka: Kafka = settings.KAFKA

    resp = await kafka.ksql.query(
        F'SELECT "targets" FROM "replica_trg_qtbl" WHERE "acct_id"={account_id};')
        
    if resp.status_code == 200:
        rows = json.loads(resp.content)

        # skip header row and selecting one record only
        if len(rows) > 1:
            targets = rows[1]['row']['columns'][0]

            if targets:
                return targets
    
    return []
