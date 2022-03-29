"""replica_api URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URL conf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
# from django.contrib import admin
from django.urls import path
from . import views
from .views import KafkaAcctTarget

urlpatterns = [
    # All
    path('connectors', views.KafkaConnectors.as_view(),
        name='connectors'),

    # Source
    path('schema-registry/src', views.KafkaSourceSchemaRegistry.as_view(),
        name='src-schema'),
    path('ktables/src', views.KafkaSourceKTable.as_view(),
        name='src-ktable'),
    path('connectors/src', views.KafkaSourceConnector.as_view(),
        name='src-connector'),

    # Sink
    path('ktables/snk', views.KafkaSinkKTable.as_view(),
        name='snk-ktable'),
    path('connectors/snk', views.KafkaSinkConnector.as_view(),
        name='snk-connector'),

    # Database Target
    path('ktables/db-trg', views.KafkaDBTargetKTable.as_view(),
        name='db-trg-ktable'),
    path('ktables/db-trg-qry', views.KafkaDBTargetKTableQueryable.as_view(),
        name='db-trg-ktable'),

    path('acct-db-trg', KafkaAcctTarget.as_view(), name='acct-db-trg'),
]
