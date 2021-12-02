"""Handles determining the settings to load based of the env environment variable set on the server."""
import pathlib
from s4_django.settings import get_environment, determine_environment, init_settings, Environments
from s4_django.log import S4Logger

logger = S4Logger(__name__)


ENV_NAME = get_environment()
ENV = determine_environment(ENV_NAME)


if ENV == Environments.UAT:
    from .uat import *
elif ENV == Environments.DEVELOPMENT:
    from .development import *
elif ENV == Environments.UNITTESTING:
    from .unittest import *
else:  # pragma: no branch
    from .production import *

if ENV != Environments.UNITTESTING:
    init_settings(F'{APP_DIR}/replica_api_settings.json', globals(), [
        'SECRET_KEY', 'JWT_SECRET_ENCRYPTION_KEY', 'ALLOWED_HOSTS'])
