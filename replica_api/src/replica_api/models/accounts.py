from asyncio.log import logger
from asgiref.sync import sync_to_async
from datetime import datetime
import logging
import json
from typing import List
from requests import Response
import sqlalchemy as orm
from sqlalchemy.future import select
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.ext.asyncio import AsyncSession
from voluptuous import Schema, Required, All, Length, ALLOW_EXTRA
from st1_kafka_api import KafkaAPI


logger = logging.getLogger(__name__)


# Data
Base = declarative_base()


class AccountChange(Base):
    """A database table containing entries tracking account record changes."""
    __tablename__ = "account_change"

    id = orm.Column('change_id', orm.Integer, primary_key=True)
    account_id = orm.Column(orm.Integer, orm.ForeignKey("account.acct_id"))
    account = relationship("Account")


class Account(Base):
    """A database table containing account information."""
    __tablename__ = "account"

    id = orm.Column('acct_id', orm.Integer, primary_key=True)
    name = orm.Column(orm.Text(length=200))
    last_change_id = orm.Column(orm.Integer)
    last_modified = orm.Column(orm.DateTime,
        server_default=orm.func.now(),
        server_onupdate=orm.func.now())


# Validators
account_name_field = All(str, Length(min=1, max=255))


create_account_schema = Schema({
    Required('name'): account_name_field,
}, extra=ALLOW_EXTRA)


update_account_schema = Schema({
    'name': account_name_field,
}, extra=ALLOW_EXTRA)


set_targets_schema = Schema({
    Required('targets'): [All(str, Length(min=1,max=255))]
}, extra=ALLOW_EXTRA)


# Logic
@sync_to_async
def create_account(db: AsyncSession, name: str = "") -> Account:
    """Create a new account.

    Args:
        name: An example property for an account.

    Returns:
        The account record newly created.
    """
    with db.begin():
        acct = Account(name=name, last_change_id=0)
        acct_change = AccountChange(account=acct)
        db.add(acct_change)
        db.flush()
        
        acct.last_change_id = acct_change.id
        db.commit()

    return acct


@sync_to_async
def update_account(db: AsyncSession, acct_id: int, **acct_data: dict) \
    -> Account:
    """Update a single account.

    Args:
        account_id: The account ID to update.
        account_data: One or more properties to update.

    Returns:
        An account record.
    """
    with db.begin():
        acct = db.scalars(
            select(Account)
            .where(Account.id == acct_id)) \
            .first()
        
        for key,value in acct_data.items():
            setattr(acct, key, value)

        account_change = AccountChange(account=acct)
        db.add(account_change)
        db.flush()
        
        acct.last_change_id = account_change.id
        acct.last_modified = datetime.utcnow()
        db.commit()

    return acct


@sync_to_async
def list_accounts(db: AsyncSession) -> List[Account]:
    """List all accounts."""
    return [acct for acct in db.scalars(select(Account).order_by(orm.asc(Account.id)))]


@sync_to_async
def get_account(db: AsyncSession, acct_id: int) -> Account:
    """Get a single account.

    Args:
        account_id: The account ID.

    Returns:
        An account record.
    """
    qry = db.scalars(
        select(Account)
        .where(Account.id == acct_id))

    return qry.first()


async def get_trg(
    kafka: KafkaAPI,
    acct_id: int,
) -> List[str]:
    resp = await kafka.ksql.query(
        'SELECT '
            '"targets" '
        'FROM "replica_trg_qtbl" '
        F'WHERE "acct_id" = {acct_id};')
    
    if resp.status_code != 200:
        return []
    try:
        data = json.loads(resp.content)

        if len(data) <= 1:
            return []
            
        row = data[1]['row']['columns']

        return row[0]
    except TypeError:
        logger.warn('unable to deserialize KSQL response', {
            'account_id': acct_id
        })
        return []


async def set_trg(
    kafka: KafkaAPI,
    acct_id: int,
    targets: list,
) -> Response:
    """Insert a database target record into the database target KSQL table.

    Returns:
        Response from the KSQL API.
    """
    if targets:
        targets_str = "'" + "','".join(targets) + "'"

        return await kafka.ksql.execute(
            F'INSERT INTO "replica_trg_tbl" ('
                '"acct_id","targets"'
            ') VALUES ('
                F'{acct_id},ARRAY[{targets_str}]'
            ');')

    return await kafka.ksql.execute(
        F'INSERT INTO "replica_trg_tbl" ('
            '"acct_id","targets"'
        ') VALUES ('
            F'{acct_id},NULL'
        ');')

