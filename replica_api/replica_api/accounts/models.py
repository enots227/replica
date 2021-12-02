import requests
import json
from django.utils.timezone import now
from django.db import models, transaction
from asgiref.sync import sync_to_async
from django.db.models.query import QuerySet
from django.conf import settings
from s4_django.log import S4Logger

logger = S4Logger(__name__)

class AccountChange(models.Model):

    class Meta:
        db_table = "account_change"

    change_id = models.BigAutoField(db_column="change_id", primary_key=True)
    account_id = models.BigIntegerField(db_column="account_id")


class Account(models.Model):

    class Meta:
        db_table = "account"

    id = models.BigAutoField(db_column="acct_id", primary_key=True)
    name = models.TextField(max_length=200, db_column="name")
    last_change_id = models.BigIntegerField(db_column="last_change_id")
    last_modified = models.DateTimeField(db_column="last_modified", auto_now=True)


@sync_to_async
@transaction.atomic
def create_account(name: str = "") -> Account:
    account_change = AccountChange( account_id=None )
    account_change.save()

    account = Account( name=name, last_change_id=account_change.change_id )
    account.save()

    account_change.account_id = account.id
    account_change.save()

    return account

def list_accounts_sync() -> QuerySet:
    return Account.objects.all()

list_accounts = sync_to_async(list_accounts_sync)

def get_account_sync(id: int) -> QuerySet:
    return Account.objects.get(id = id)

get_account = sync_to_async(get_account_sync)

@sync_to_async
def update_account(id: int, **account_data: str) -> Account:
    account_change = AccountChange( account_id=id )
    account_change.save()

    account = Account.objects.get( id=id )
    account.last_change_id = account_change.change_id
    account.last_modified = now()

    for key, value in account_data.items():
        setattr(account, key, value)

    account.save()

    return account


def get_account_targets(id: int) -> list:
    url = F'http://{settings.KSQL}/query'
    payload = {
        'ksql': F'SELECT TARGETS FROM QUERYABLE_REPLICA_TRG_TBL WHERE ACCT_ID = {id};',
        'streamsProperties': {}
    }

    logger.info(3142, F'KSQL select QUERYABLE_REPLICA_TRG_TBL request', log_data={
        'url': url,
        'payload': payload
    })

    resp = requests.post(url, json = payload)

    if resp.status_code == 200:
        rows = json.loads(resp.text)

        logger.info(3143, F'successfully select ktable QUERYABLE_REPLICA_TRG_TBL', log_data={
            'resp.status_code': resp.status_code,
            'resp.reason': resp.reason,
            'resp.text': rows,
        })
        
        # skip header row and selecting one record only
        if len(rows) > 1:
            return rows[1]['row']['columns'][0]
    else:
        logger.error(3144, F'failed to select ktable QUERYABLE_REPLICA_TRG_TBL', log_data={
            'resp.status_code': resp.status_code,
            'resp.reason': resp.reason,
            'resp.text': resp.text,
        })
    
    return []