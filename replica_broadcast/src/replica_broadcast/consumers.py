import json
from channels.generic.websocket import AsyncWebsocketConsumer


class BroadcastConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.acct_id = self.scope['url_route']['kwargs']['acct_id']
        self.room_group_name = 'chat_%s' % self.acct_id

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'target': message,
                'statusCode': 200
            }
        )

    # Receive message from room group
    async def chat_message(self, event):
        target = event['target']
        statusCode = event['statusCode']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'target': target,
            'statusCode': statusCode
        }))

