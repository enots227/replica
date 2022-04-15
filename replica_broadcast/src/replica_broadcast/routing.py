from django.urls import re_path

from .consumers import BroadcastConsumer

websocket_urlpatterns = [
    re_path(r'ws/broadcast/(?P<acct_id>\d+)/$', BroadcastConsumer.as_asgi()),
]