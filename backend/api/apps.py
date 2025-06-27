from django.apps import AppConfig
import firebase_admin
from firebase_admin import credentials
import os
from dotenv import load_dotenv
import sys

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        # This method is called once when the Django app is ready.
        if not firebase_admin._apps:
            print("Initializing Firebase...")
            project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
            load_dotenv(os.path.join(project_root, '.env'))

            try:
                private_key = os.getenv('PRIVATE_KEY', '').replace('\\n', '\n')
                creds_info = {
                    "type": os.getenv("TYPE"),
                    "project_id": os.getenv("PROJECT_ID"),
                    "private_key_id": os.getenv("PRIVATE_KEY_ID"),
                    "private_key": private_key,
                    "client_email": os.getenv("CLIENT_EMAIL"),
                    "client_id": os.getenv("CLIENT_ID"),
                    "auth_uri": os.getenv("AUTH_URI"),
                    "token_uri": os.getenv("TOKEN_URI"),
                    "auth_provider_x509_cert_url": os.getenv("AUTH_PROVIDER_X509_CERT_URL"),
                    "client_x509_cert_url": os.getenv("CLIENT_X509_CERT_URL"),
                    "universe_domain": os.getenv("UNIVERSE_DOMAIN")
                }
                
                if not all(creds_info.values()):
                    print("WARNING: Missing one or more Firebase credentials. Firebase integration might fail.")
                else:
                    cred = credentials.Certificate(creds_info)
                    firebase_admin.initialize_app(cred)
                    print("Firebase App initialized successfully for Django.")

            except Exception as e:
                print(f"Error initializing Firebase App for Django: {e}")
                # We raise this to ensure the server doesn't start in a broken state.
                raise e 