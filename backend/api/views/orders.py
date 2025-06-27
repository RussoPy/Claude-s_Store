import os
import sys
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.core.mail import send_mail
from django.conf import settings

# --- Firebase Initialization ---
# This setup is based on your populate_firestore.py script
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.append(project_root)
env_path = os.path.join(project_root, 'backend', '.env')
load_dotenv(dotenv_path=env_path)

def initialize_firebase():
    """Initializes the Firebase Admin SDK if not already initialized."""
    if not firebase_admin._apps:
        try:
            private_key = os.getenv('PRIVATE_KEY', '').replace('\\n', '\n')
            creds = {
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
            if not all(creds.values()):
                raise ValueError("Missing one or more Firebase credentials in .env file.")
            
            cred = credentials.Certificate(creds)
            firebase_admin.initialize_app(cred)
            print("Firebase initialized successfully for orders.")
        except Exception as e:
            print(f"Error initializing Firebase for orders: {e}")
            # In a real app, you might want to handle this more gracefully
            raise e
    return firestore.client()

def send_order_emails(order_data):
    """Helper function to send customer and admin emails."""
    
    # Format the items for the email body
    items_list = ""
    for item in order_data.get('items', []):
        items_list += f"- {item['name']} (Quantity: {item['quantity']}) - ₪{item['price']:.2f}\n"

    # --- Email to Customer ---
    subject_customer = f"ההזמנה שלך מ-claudeShop אושרה! מספר הזמנה: {order_data['order_id']}"
    message_customer = f"""
    שלום {order_data['payer_name']},

    תודה על הזמנתך! קיבלנו את הזמנתך והיא כעת בטיפול.

    סיכום הזמנה:
    {items_list}
    סך הכל: ₪{float(order_data['amount']['value']):.2f}

    תודה שבחרת ב-claudeShop!
    """
    send_mail(
        subject=subject_customer,
        message=message_customer,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[order_data['payer_email']],
        fail_silently=False,
    )
    print(f"Customer confirmation email sent to {order_data['payer_email']}")

    # --- Email to Admin ---
    subject_admin = f"הזמנה חדשה התקבלה! מספר הזמנה: {order_data['order_id']}"
    message_admin = f"""
    התקבלה הזמנה חדשה!

    פרטי הזמנה:
    מספר הזמנה: {order_data['order_id']}
    שם המזמין: {order_data['payer_name']} ({order_data['payer_email']})
    טלפון: {order_data.get('payer_phone', 'N/A')}

    מוצרים:
    {items_list}
    סך הכל: ₪{float(order_data['amount']['value']):.2f}
    """
    send_mail(
        subject=subject_admin,
        message=message_admin,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[settings.ADMIN_EMAIL],
        fail_silently=False,
    )
    print(f"Admin notification email sent to {settings.ADMIN_EMAIL}")

@api_view(['POST'])
@permission_classes([AllowAny])
def create_order(request):
    """
    View to create a new order in Firestore after successful PayPal payment.
    """
    if request.method == 'POST':
        try:
            db = initialize_firebase()
            data = json.loads(request.body)
            
            paypal_details = data.get('paypalDetails')
            cart_items = data.get('cartItems')
            
            if not paypal_details or not cart_items:
                return JsonResponse({'status': 'error', 'message': 'Missing order data'}, status=400)

            # --- For security, you should verify the payment with PayPal's API here ---
            # This is a critical step that is omitted for brevity but necessary for production.
            # You would take paypal_details.id and call PayPal's API to confirm the transaction.
            
            # 1. Prepare the initial data without the Firestore ID
            order_data = {
                'paypal_order_id': paypal_details.get('id'),
                'payer_name': paypal_details.get('payer', {}).get('name', {}).get('given_name', 'N/A'),
                'payer_email': paypal_details.get('payer', {}).get('email_address', 'N/A'),
                'payer_phone': paypal_details.get('payer', {}).get('phone', {}).get('phone_number', {}).get('national_number', 'N/A'),
                'amount': paypal_details.get('purchase_units', [{}])[0].get('amount', {}),
                'status': paypal_details.get('status'),
                'items': cart_items,
                'created_at': datetime.datetime.now(datetime.timezone.utc)
            }
            
            # 2. Add the document to Firestore to get its reference/ID
            orders_collection = db.collection('orders')
            update_time, order_ref = orders_collection.add(order_data)
            
            # 3. Now that we have the ID, add it to our data object
            order_data['order_id'] = order_ref.id
            
            # 4. Send emails with the complete data
            try:
                send_order_emails(order_data)
            except Exception as e:
                # Log this error but don't fail the entire request,
                # as the payment was successful.
                print(f"CRITICAL: Could not send order emails for order {order_ref.id}. Error: {e}")

            return JsonResponse({'status': 'success', 'order_id': order_ref.id})
            
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=405) 