"""
Django settings for project.

Generated by 'django-admin startproject' using Django 3.2.6.

For more information on this file, see
https://docs.djangoproject.com/en/3.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/3.2/ref/settings/
"""
import os
import sys
from pathlib import Path
from distutils.util import strtobool
import socket
from st1_kafka_api import KafkaAPI
from st1_kafka_api.ksql import KSQL
from st1_kafka_api.connect import Connect
from st1_kafka_api.schema_registry import SchemaRegistry


# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/3.2/howto/deployment/checklist/

SECRET_KEY = os.getenv('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = strtobool(os.getenv('DEBUG', 'false'))

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split()

# Application definition
INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'channels',
    'replica_broadcast',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    # 'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'st1_django.error_handlers.St1ExceptionMiddleware',
]

ROOT_URLCONF = 'project.urls'

ASGI_APPLICATION = 'project.asgi.application'


# Internationalization
# https://docs.djangoproject.com/en/3.2/topics/i18n/
LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True

# Cross-Origin Resource Sharing Policy
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '').split()

# Websocket
# https://channels.readthedocs.io/en/stable/topics/channel_layers.html#configuration
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [('redis', 6379)],
        },
    },
}

# Kafka
KAFKA_API = KafkaAPI(
    bootstrap_servers=os.getenv('KAFKA_BOOTSTRAP_SERVERS'),
    client_id=socket.gethostname(),
    connect = Connect(url=os.getenv('CONNECT_URL')),
    ksql = KSQL(url=os.getenv('KSQL_URL')),
    schema_registry = SchemaRegistry(url=os.getenv('SCHEMA_REGISTRY_URL')),
)


# Logging
# noinspection SpellCheckingInspection
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '%(asctime)s %(levelname)s %(name)s %(module)s '
                '%(funcName)s %(lineno)s %(message)s',
            'rename_fields': {
                'asctime': 'timeStamp',
                'levelname': 'severity',
                'name': 'logger',
            },
        },
        'console_debugging': {
            '()': 'st1_logging.ConsoleDebugFormatter',
            'format': '',
            'json_indent': 4,
        },
    },
    'filters': {
        'requestid': {
            '()': 'django_guid.log_filters.CorrelationId'
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'console_debugging',
            'filters': ['requestid'],
            "stream": sys.stdout,
        },
        'file': {
            'class': 'logging.FileHandler',
            'formatter': 'verbose',
            'filters': ['requestid'],
            'level': 'DEBUG',
            'filename': '/usr/src/logs/replica_broadcast.log',
        },
    },
    'loggers': {
        'asyncio': {
            'level': 'WARN'
        },
        'django': {
            'level': 'INFO',
        },
        'django.utils.autoreload': {
            'level': 'WARN',
            'propagate': True,
        },
        'django_guid': {
            'level': 'WARN'
        },
    },
    'root': {
        'handlers': ['file'],
        'level': 'INFO',
    }
}

if DEBUG:
    LOGGING['root']['handlers'].append('console')
    LOGGING['root']['level'] = 'DEBUG'
