from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework import exceptions
from django.contrib.auth.models import User
from firebase_admin import auth

class FirebaseAuthentication(BaseAuthentication):
    """
    Custom authentication class for Firebase.
    It authenticates the user based on a Firebase ID token in the Authorization header.
    """
    def authenticate(self, request):
        auth_header = get_authorization_header(request).split()
        
        if not auth_header or auth_header[0].lower() != b'bearer':
            return None # No token provided, authentication attempt fails silently

        if len(auth_header) == 1:
            raise exceptions.AuthenticationFailed('Invalid token header. No credentials provided.')
        elif len(auth_header) > 2:
            raise exceptions.AuthenticationFailed('Invalid token header. Token string should not contain spaces.')

        try:
            token = auth_header[1].decode('utf-8')
            decoded_token = auth.verify_id_token(token)
            uid = decoded_token['uid']
            
            # Here, we get or create a Django user.
            # This allows us to use Django's built-in permission system (e.g., IsAdminUser).
            # In a production app, you might want to sync more user details.
            user, created = User.objects.get_or_create(username=uid)
            
            if created:
                # Set user as staff or superuser based on Firebase custom claims
                is_admin = decoded_token.get('isAdmin', False)
                if is_admin:
                    user.is_staff = True
                    user.save()
            
            return (user, None) # Authentication successful

        except auth.InvalidIdTokenError:
            raise exceptions.AuthenticationFailed('Invalid ID token.')
        except auth.ExpiredIdTokenError:
            raise exceptions.AuthenticationFailed('ID token has expired.')
        except Exception as e:
            # Catch other Firebase or decode errors
            raise exceptions.AuthenticationFailed(f'Firebase authentication failed: {e}')

        return None 