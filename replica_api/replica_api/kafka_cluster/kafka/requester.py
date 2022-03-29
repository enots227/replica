from typing import Union
from asgiref.sync import sync_to_async
from urllib.parse import urljoin
from logging import Logger
import requests

logger = Logger(__name__)


class Requester:

    def __init__(self, url: str):
        self.url = url

    def _url(self, path: str) -> str:
        return urljoin(self.url, path)

    @sync_to_async
    def make_request(self,
        method: Union[str,bytes],
        path: Union[str,bytes],
        **kwargs
    ) -> requests.Response:
        url = self._url(path)
        payload = kwargs['json'] if 'json' in kwargs else None

        logger.info('kafka API request to {method} {url}: {payload}',
            method, url, payload)
            
        resp = requests.request(method, url, **kwargs)

        logger.info('kafka API response from {method} {url}: {content}',
            method, url, resp.content)

        return resp

