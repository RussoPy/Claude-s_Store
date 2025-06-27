from django.core.management.base import BaseCommand, CommandError
from firebase_admin import auth, firestore

class Command(BaseCommand):
    help = 'Grants admin privileges to a Firebase user by adding them to the "admins" collection and setting a custom claim.'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='The email address of the Firebase user to make an admin.')

    def handle(self, *args, **options):
        email = options['email']
        try:
            # Get the user by email from Firebase Auth
            user = auth.get_user_by_email(email)
            uid = user.uid
            self.stdout.write(self.style.SUCCESS(f'Found user: {email} (UID: {uid})'))

            # Set a custom claim
            auth.set_custom_user_claims(uid, {'isAdmin': True})
            self.stdout.write(self.style.SUCCESS('Set custom claim "isAdmin: True" on the user.'))

            # Add the user to the 'admins' collection in Firestore
            db = firestore.client()
            admin_ref = db.collection('admins').document(uid)
            admin_ref.set({'email': email, 'isSuperAdmin': False}) # You can extend this later
            
            self.stdout.write(self.style.SUCCESS(
                f'Successfully granted admin privileges to {email}.'
            ))
            self.stdout.write(self.style.NOTICE(
                'The user will need to log in again for the custom claim to take effect.'
            ))

        except auth.UserNotFoundError:
            raise CommandError(f'User with email {email} not found in Firebase Authentication.')
        except Exception as e:
            raise CommandError(f'An error occurred: {e}') 