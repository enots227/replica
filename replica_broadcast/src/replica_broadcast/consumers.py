import json
from logging import Logger
from channels.generic.websocket import AsyncWebsocketConsumer


logger = Logger(__name__)


class BroadcastConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.acct_id = self.scope['url_route']['kwargs']['acct_id']
        self.room_group_name = 'acct_%s' % self.acct_id

        logger.info('user joined group', extra={ 'acct_id': self.acct_id })

        # join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        logger.info('user left group', extra={ 'acct_id': self.acct_id })

        # leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # receive message from Kafka consumer
    async def acct_message(self, event):
        label = event['label']
        outcome = event['outcome']

        logger.info('broadcasting message for group', extra={
            'acct_id': self.acct_id,
            'event': event })

        # send message to WebSocket
        await self.send(text_data=json.dumps({
            'label': label,
            'outcome': outcome
        }))

