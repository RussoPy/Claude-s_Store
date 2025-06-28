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
import requests # Will be used for PayPal API calls

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

# --- PayPal Verification Functions ---

PAYPAL_API_BASE = "https://api-m.sandbox.paypal.com" if settings.DEBUG else "https://api-m.paypal.com"

def get_paypal_access_token():
    """Get access token from PayPal."""
    client_id = os.getenv("PAYPAL_CLIENT_ID")
    client_secret = os.getenv("PAYPAL_CLIENT_SECRET")
    
    if not client_id or not client_secret:
        raise ValueError("Missing PayPal API credentials in .env file.")

    auth_url = f"{PAYPAL_API_BASE}/v1/oauth2/token"
    headers = {"Accept": "application/json", "Accept-Language": "en_US"}
    auth = (client_id, client_secret)
    data = {"grant_type": "client_credentials"}
    
    try:
        response = requests.post(auth_url, headers=headers, auth=auth, data=data)
        response.raise_for_status()  # Raises an exception for bad responses (4xx or 5xx)
        return response.json()["access_token"]
    except requests.exceptions.RequestException as e:
        print(f"Error getting PayPal access token: {e}")
        return None

def verify_paypal_payment(paypal_order_id):
    """
    Verify the payment with PayPal's API to ensure it's legitimate.
    Returns the verified order details from PayPal or None if invalid.
    """
    access_token = get_paypal_access_token()
    if not access_token:
        return None

    verify_url = f"{PAYPAL_API_BASE}/v2/checkout/orders/{paypal_order_id}"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}",
    }
    
    try:
        response = requests.get(verify_url, headers=headers)
        response.raise_for_status()
        verified_order_data = response.json()
        
        # Check if the payment status is COMPLETED
        if verified_order_data.get("status") == "COMPLETED":
            return verified_order_data
        else:
            print(f"PayPal payment not completed. Status: {verified_order_data.get('status')}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Error verifying PayPal payment: {e}")
        return None

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
    View to create a new order in Firestore after successful and VERIFIED PayPal payment.
    """
    if request.method == 'POST':
        try:
            db = initialize_firebase()
            data = json.loads(request.body)
            
            paypal_order_id_from_client = data.get('paypalDetails', {}).get('id')
            cart_items = data.get('cartItems')
            
            if not paypal_order_id_from_client or not cart_items:
                return JsonResponse({'status': 'error', 'message': 'Missing order data'}, status=400)

            # --- VERIFICATION STEP ---
            # Instead of trusting the client, we verify the order with PayPal directly.
            print(f"Verifying PayPal Order ID: {paypal_order_id_from_client}")
            verified_paypal_order = verify_paypal_payment(paypal_order_id_from_client)

            if not verified_paypal_order:
                print(f"PayPal verification failed for Order ID: {paypal_order_id_from_client}")
                return JsonResponse({'status': 'error', 'message': 'PayPal payment verification failed.'}, status=400)
            
            print(f"PayPal verification successful for Order ID: {paypal_order_id_from_client}")

            # --- DATA FROM VERIFIED SOURCE ---
            # Use the verified data from PayPal as the source of truth.
            purchase_unit = verified_paypal_order.get('purchase_units', [{}])[0]
            payer_info = verified_paypal_order.get('payer', {})

            # Security Check: Compare client-side total with server-side verified total
            client_total = sum(float(item['price']) * int(item['quantity']) for item in cart_items)
            paypal_total = float(purchase_unit.get('amount', {}).get('value', '0'))

            if not abs(client_total - paypal_total) < 0.01:
                print(f"CRITICAL: Amount mismatch for Order {paypal_order_id_from_client}. Client: {client_total}, PayPal: {paypal_total}")
                return JsonResponse({'status': 'error', 'message': 'Order total mismatch.'}, status=400)

            # Extract the relevant IDs from the verified data.
            try:
                # This is the internal ID for the capture event.
                capture_id = purchase_unit['payments']['captures'][0]['id']
            except (KeyError, IndexError):
                capture_id = 'N/A'
                print(f"WARNING: Could not find capture ID for order {paypal_order_id_from_client}. Full purchase unit: {purchase_unit}")

            # Prepare the data for Firestore using the verified data
            order_data = {
                'paypal_order_id': verified_paypal_order.get('id'),
                'paypal_capture_id': capture_id, # Changed from transaction_id
                'payer_name': payer_info.get('name', {}).get('given_name', 'N/A'),
                'payer_email': payer_info.get('email_address', 'N/A'),
                'payer_phone': payer_info.get('phone', {}).get('phone_number', {}).get('national_number', 'N/A'),
                'amount': purchase_unit.get('amount', {}),
                'status': verified_paypal_order.get('status'),
                'items': cart_items,
                'created_at': datetime.datetime.now(datetime.timezone.utc)
            }
            
            # Add the document to Firestore to get its reference/ID
            orders_collection = db.collection('orders')
            update_time, order_ref = orders_collection.add(order_data)
            
            # Now that we have the ID, add it to our data object
            order_data['order_id'] = order_ref.id
            
            # Send emails with the complete data
            try:
                send_order_emails(order_data)
            except Exception as e:
                # Log this error but don't fail the entire request,
                # as the payment was successful.
                print(f"CRITICAL: Could not send order emails for order {order_ref.id}. Error: {e}")

            # Return the Firestore Order ID and the PayPal Capture ID (which is searchable in the dashboard)
            return JsonResponse({'status': 'success', 'firestore_order_id': order_ref.id, 'paypal_capture_id': capture_id})
            
        except ValueError as e: # Catch specific error for missing creds
            print(f"Configuration Error: {e}")
            return JsonResponse({'status': 'error', 'message': 'Server configuration error.'}, status=500)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=405) 