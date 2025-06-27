from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import requests
import os
from firebase_admin import auth

class AdminLoginView(APIView):
    """
    A view for admin users to log in using their email and password.
    It authenticates against Firebase and checks for admin privileges.
    """
    permission_classes = [] # No permissions needed to attempt a login

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        password = request.data.get('password')
        web_api_key = os.getenv('FIREBASE_WEB_API_KEY')

        if not email or not password:
            return Response({'error': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not web_api_key:
            return Response({'error': 'Server configuration error: Firebase Web API Key not set.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Construct the Firebase Auth REST API URL
        rest_api_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={web_api_key}"
        
        # Prepare the payload
        payload = {
            'email': email,
            'password': password,
            'returnSecureToken': True
        }

        try:
            # Make the request to Firebase
            response = requests.post(rest_api_url, json=payload)
            response_data = response.json()

            if response.status_code != 200:
                error_message = response_data.get('error', {}).get('message', 'Invalid credentials.')
                return Response({'error': error_message}, status=status.HTTP_401_UNAUTHORIZED)

            # Successfully authenticated with Firebase, now verify admin status
            id_token = response_data.get('idToken')
            try:
                decoded_token = auth.verify_id_token(id_token)
                uid = decoded_token['uid']
                
                # Check for the custom admin claim
                user_record = auth.get_user(uid)
                is_admin = user_record.custom_claims.get('isAdmin', False)
                
                if not is_admin:
                    return Response({'error': 'You do not have admin privileges.'}, status=status.HTTP_403_FORBIDDEN)

                # User is an admin, return the token
                return Response({
                    'message': 'Admin login successful.',
                    'idToken': id_token,
                    'uid': uid
                })

            except auth.InvalidIdTokenError:
                return Response({'error': 'Invalid ID token.'}, status=status.HTTP_401_UNAUTHORIZED)
            except Exception as e:
                 return Response({'error': f'An error occurred during admin verification: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except requests.exceptions.RequestException as e:
            return Response({'error': f'Could not connect to authentication service: {str(e)}'}, status=status.HTTP_503_SERVICE_UNAVAILABLE) 