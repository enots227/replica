from typing import Dict, Optional
from rest_framework import serializers


# noinspection PyAbstractClass
class AccountSerializer(serializers.Serializer):
    """"""
    id = serializers.ReadOnlyField()
    name = serializers.CharField(max_length=200)