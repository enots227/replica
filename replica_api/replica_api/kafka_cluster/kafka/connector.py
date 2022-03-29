from requests import Response
from .requester import Requester


class KafkaConnector(Requester):

    async def get_connectors(self) -> Response:
        return await self.make_request('GET',
            '/connectors/?expand=info&expand=status')

    async def create_connector(self, name: str, config: dict) -> Response:
        return await self.make_request('POST', '/connectors',
            json = { 'name': name, 'config': config })

    async def delete_connector(self, name: str) -> Response:
        return await self.make_request('DELETE', '/connectors/' + name)

