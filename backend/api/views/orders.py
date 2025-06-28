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
from django.core.mail import EmailMultiAlternatives
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
    """Helper function to send customer and admin emails in a structured HTML format."""
    
    # --- Data Preparation ---
    items_list_text = ""
    items_list_html = ""
    for item in order_data.get('items', []):
        item_line_text = f"- {item['name']} (כמות: {item['quantity']}) - ₪{float(item['price']):.2f}"
        items_list_text += item_line_text + "\n"
        items_list_html += f"<li>{item_line_text}</li>"

    order_id_for_email = order_data.get('paypal_capture_id', order_data.get('order_id', 'N/A'))
    total_price = float(order_data['amount']['value'])
    customer_name = order_data.get('customer_name', 'לקוח') 
    payer_email = order_data.get('payer_email')
    payer_phone = order_data.get('payer_phone', 'לא צוין')

    # --- Details for Admin ---
    payment_time_raw = order_data.get('payment_time')
    payment_time_formatted = 'לא צוין'
    if payment_time_raw:
        try:
            payment_dt = datetime.datetime.fromisoformat(payment_time_raw.replace("Z", "+00:00"))
            payment_time_formatted = payment_dt.strftime('%d/%m/%Y %H:%M:%S') + " (UTC)"
        except (ValueError, TypeError):
             payment_time_formatted = str(payment_time_raw)

    shipping_address_obj = order_data.get('shipping_address', {})
    address_parts = [
        shipping_address_obj.get('address_line_1'), # Street
        shipping_address_obj.get('admin_area_2'), # City
        shipping_address_obj.get('admin_area_1'), # State
        shipping_address_obj.get('postal_code'),
        shipping_address_obj.get('country_code')
    ]
    shipping_address_text = ", ".join(filter(None, address_parts))
    if not shipping_address_text:
        shipping_address_text = 'לא צוינה'

    # --- Email to Customer ---
    subject_customer = f"אישור הזמנה מ-claudeShop! מספר הזמנה: {order_id_for_email}"
    
    text_content_customer = f"""
    שלום {customer_name},

    תודה רבה על הזמנתך! קיבלנו אותה והיא בטיפול.

    סיכום הזמנה:
    {items_list_text}
    סך הכל לתשלום: ₪{total_price:.2f}

    מספר ההזמנה שלך למעקב הוא: {order_id_for_email}

    תודה שבחרת ב-claudeShop!
    צוות claudeShop
    """

    html_content_customer = f"""
    <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.6;">
        <h2>שלום {customer_name},</h2>
        <p>תודה רבה על הזמנתך! קיבלנו אותה והיא כעת בטיפול.</p>
        <h3>סיכום הזמנה</h3>
        <ul style="list-style-type: none; padding: 0;">
            {items_list_html}
        </ul>
        <p style="font-size: 1.1em;"><strong>סך הכל לתשלום: ₪{total_price:.2f}</strong></p>
        <p><strong>מספר ההזמנה שלך למעקב הוא:</strong> {order_id_for_email}</p>
        <hr>
        <p>תודה שבחרת בנו,</p>
        <p>צוות claudeShop</p>
    </div>
    """
    
    msg_customer = EmailMultiAlternatives(
        subject=subject_customer,
        body=text_content_customer,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[payer_email]
    )
    msg_customer.attach_alternative(html_content_customer, "text/html")
    msg_customer.send(fail_silently=False)


    # --- Email to Admin ---
    subject_admin = f"התקבלה הזמנה חדשה! מספר הזמנה: {order_id_for_email}"

    text_content_admin = f"""
    התקבלה הזמנה חדשה!

    פרטי ההזמנה:
    מספר הזמנה: {order_id_for_email}
    שעת תשלום: {payment_time_formatted}

    פרטי הלקוח:
    שם: {customer_name}
    אימייל: {payer_email}
    טלפון: {payer_phone}
    כתובת למשלוח: {shipping_address_text}

    מוצרים:
    {items_list_text}
    סך הכל: ₪{total_price:.2f}
    """
    
    html_content_admin = f"""
    <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.6;">
        <h2>התקבלה הזמנה חדשה!</h2>
        
        <h3>פרטי ההזמנה</h3>
        <ul style="list-style-type: none; padding: 0; margin-right: 0; padding-right: 0;">
            <li><strong>מספר הזמנה:</strong> {order_id_for_email}</li>
            <li><strong>שעת תשלום:</strong> {payment_time_formatted}</li>
        </ul>

        <h3>פרטי הלקוח</h3>
        <ul style="list-style-type: none; padding: 0; margin-right: 0; padding-right: 0;">
            <li><strong>שם:</strong> {customer_name}</li>
            <li><strong>אימייל:</strong> {payer_email}</li>
            <li><strong>טלפון ליצירת קשר:</strong> {payer_phone}</li>
            <li><strong>כתובת למשלוח:</strong> {shipping_address_text}</li>
        </ul>

        <h3>פירוט המוצרים:</h3>
        <ul style="list-style-type: none; padding: 0; margin-right: 0; padding-right: 0;">
            {items_list_html}
        </ul>
        <p style="font-size: 1.1em;"><strong>סך הכל: ₪{total_price:.2f}</strong></p>
    </div>
    """

    msg_admin = EmailMultiAlternatives(
        subject=subject_admin,
        body=text_content_admin,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[settings.ADMIN_EMAIL]
    )
    msg_admin.attach_alternative(html_content_admin, "text/html")
    msg_admin.send(fail_silently=False)

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

            # Extract the relevant IDs and timestamps from the verified data.
            try:
                capture_details = purchase_unit.get('payments', {}).get('captures', [{}])[0]
                capture_id = capture_details.get('id')
                payment_time = capture_details.get('create_time')
            except (KeyError, IndexError):
                capture_id = 'N/A'
                payment_time = None
                print(f"WARNING: Could not find capture details for order {paypal_order_id_from_client}.")

            # Extract full name and address details
            shipping_info = purchase_unit.get('shipping', {})
            shipping_address_obj = shipping_info.get('address', {})
            
            payer_name_obj = payer_info.get('name', {})
            payer_full_name = f"{payer_name_obj.get('given_name', '')} {payer_name_obj.get('surname', '')}".strip()
            
            # The primary customer name should be from the shipping details if available, otherwise use payer name.
            customer_name_for_order = shipping_info.get('name', {}).get('full_name', payer_full_name) or 'N/A'

            # Prepare the data for Firestore using the verified data
            order_data = {
                'paypal_order_id': verified_paypal_order.get('id'),
                'paypal_capture_id': capture_id,
                'customer_name': customer_name_for_order, # Replaces payer_name
                'payer_email': payer_info.get('email_address', 'N/A'),
                'payer_phone': payer_info.get('phone', {}).get('phone_number', {}).get('national_number', 'N/A'),
                'amount': purchase_unit.get('amount', {}),
                'status': verified_paypal_order.get('status'),
                'items': cart_items,
                'created_at': datetime.datetime.now(datetime.timezone.utc),
                'payment_time': payment_time,
                'shipping_address': shipping_address_obj,
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
                print(f"CRITICAL: Could not send order emails for order {order_data.get('order_id', 'N/A')}. PayPal Capture ID: {order_data.get('paypal_capture_id', 'N/A')}. Error: {e}")

            # Return the Firestore Order ID and the PayPal Capture ID (which is searchable in the dashboard)
            return JsonResponse({'status': 'success', 'firestore_order_id': order_ref.id, 'paypal_capture_id': capture_id})
            
        except ValueError as e: # Catch specific error for missing creds
            print(f"Configuration Error: {e}")
            return JsonResponse({'status': 'error', 'message': 'Server configuration error.'}, status=500)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=405) 