"""Test the project."""
import os
from importlib import reload  
from s4_django.unittest import S4WebTestCase
from s4_django.settings import get_environment
import replica_api.settings


# noinspection PyMethodMayBeStatic
class SettingsTestCase(S4WebTestCase):
    """Test the project."""

    def setUp(self) -> None:
        """Save the current env environment variable because later it will be replaced."""
        super().setUp()

        self.current_env = get_environment()

    def tearDown(self) -> None:
        """Restore the current env environment variable."""
        super().tearDown()

        os.environ['env'] = self.current_env

    def test_settings_production(self):
        """Test that the replica.settings.production file has no syntax errors."""
        os.environ['env'] = 'PRODUCTION'

        reload(replica_api.settings)

    def test_settings_uat(self):
        """Test that the replica.settings.uat file has no syntax errors."""
        os.environ['env'] = 'UAT'

        reload(replica_api.settings)

    def test_settings_development(self):
        """Test that the replica_api.settings.development file has no syntax errors."""
        os.environ['env'] = 'DEVELOPMENT'

        reload(replica_api.settings)
