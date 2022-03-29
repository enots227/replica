"""Handles the serializer logic for accounts."""
from rest_framework import serializers


# noinspection PyAbstractClass
class AccountSerializer(serializers.Serializer):
    """The account serializer."""
    id = serializers.ReadOnlyField()
    name = serializers.CharField(max_length=200)
