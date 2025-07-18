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

# Use an explicit environment variable for PayPal's mode
PAYPAL_MODE = os.getenv('PAYPAL_MODE', 'sandbox') # Default to sandbox for safety
PAYPAL_API_BASE = "https://api-m.sandbox.paypal.com" if PAYPAL_MODE == 'sandbox' else "https://api-m.paypal.com"

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
    
    coupon_used = order_data.get('coupon_used')
    discount_percentage = order_data.get('discount_percentage')

    # --- Construct Discount Information ---
    discount_text = ""
    discount_html = ""
    if coupon_used and discount_percentage:
        original_price = total_price / (1 - discount_percentage / 100)
        discount_text = f"\nקופון בשימוש: {coupon_used} ({discount_percentage}% הנחה)\nסכום מקורי: ₪{original_price:.2f}\n"
        discount_html = f"""
        <p style="color: #28a745;">
            <strong>קופון בשימוש:</strong> {coupon_used} ({discount_percentage}% הנחה)
            <br>
            <span style="text-decoration: line-through;">סכום מקורי: ₪{original_price:.2f}</span>
        </p>
        """

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

    # --- NEW: Get Shipping Method ---
    shipping_method = order_data.get('shipping_method', 'pickup') # Default to pickup if not provided
    shipping_method_hebrew = "איסוף עצמי" if shipping_method == 'pickup' else "משלוח"

    # --- Email to Customer ---
    subject_customer = f"אישור הזמנה מ-claudeShop! מספר הזמנה: {order_id_for_email}"
    
    text_content_customer = f"""
    שלום {customer_name},

    תודה רבה על הזמנתך! קיבלנו אותה והיא בטיפול.

    סיכום הזמנה:
    {items_list_text}
    {discount_text}
    סך הכל לתשלום: ₪{total_price:.2f}

    אופן קבלת ההזמנה: {shipping_method_hebrew}

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
        {discount_html}
        <p style="font-size: 1.1em;"><strong>סך הכל לתשלום: ₪{total_price:.2f}</strong></p>
        <p><strong>אופן קבלת ההזמנה:</strong> {shipping_method_hebrew}</p>
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
    תאריך תשלום: {payment_time_formatted}

    אופן קבלת ההזמנה: {shipping_method_hebrew}

    פרטי הלקוח:
    שם: {customer_name}
    אימייל: {payer_email}
    טלפון: {payer_phone}
    כתובת למשלוח: {shipping_address_text}

    מוצרים:
    {items_list_text}
    {discount_text}
    סך הכל: ₪{total_price:.2f}
    """
    
    html_content_admin = f"""
    <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.6;">
        <h2>התקבלה הזמנה חדשה!</h2>
        
        <h3>פרטי ההזמנה</h3>
        <ul style="list-style-type: none; padding: 0;">
            <li><strong>מספר הזמנה:</strong> {order_id_for_email}</li>
            <li><strong>תאריך תשלום:</strong> {payment_time_formatted}</li>
        </ul>
        <p style="background-color: #ffc107; padding: 5px; border-radius: 5px; display: inline-block;">
            <strong>אופן קבלת ההזמנה: {shipping_method_hebrew}</strong>
        </p>

        <h3>פרטי הלקוח</h3>
        <ul style="list-style-type: none; padding: 0;">
            <li><strong>שם:</strong> {customer_name}</li>
            <li><strong>אימייל:</strong> {payer_email}</li>
            <li><strong>טלפון ליצירת קשר:</strong> {payer_phone}</li>
            <li><strong>כתובת למשלוח:</strong> {shipping_address_text}</li>
        </ul>

        <h3>פירוט המוצרים:</h3>
        <ul style="list-style-type: none; padding: 0;">
            {items_list_html}
        </ul>
        {discount_html}
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
    Main endpoint to create an order.
    Receives PayPal details and cart from the frontend, verifies payment with PayPal,
    saves the order to Firestore, and sends confirmation emails.
    """
    try:
        data = json.loads(request.body)
        paypal_details = data.get('paypalDetails', {})
        cart_items = data.get('cartItems', [])
        coupon_code = data.get('couponCode', None)
        shipping_method = data.get('shippingMethod', 'pickup')

        db = initialize_firebase()
        
        paypal_order_id = paypal_details.get('id')

        if not paypal_order_id or not cart_items:
            return JsonResponse({'message': 'Missing PayPal order ID or cart items.'}, status=400)

        # 1. Verify payment with PayPal
        print(f"Verifying PayPal Order ID: {paypal_order_id}")
        verified_paypal_order = verify_paypal_payment(paypal_order_id)
        if not verified_paypal_order:
            print(f"CRITICAL: PayPal payment verification failed for Order ID: {paypal_order_id}")
            return JsonResponse({'message': 'PayPal payment verification failed.'}, status=400)
        
        print(f"PayPal verification successful for Order ID: {paypal_order_id}")

        # 2. Calculate server-side total and apply coupon if applicable
        server_total = sum(float(item['price']) * int(item['quantity']) for item in cart_items)
        discount_percentage = 0

        if coupon_code:
            print(f"Attempting to apply coupon: {coupon_code}")
            # Get payer email from PayPal details (if available)
            payer_email = None
            if 'payer' in paypal_details and 'email_address' in paypal_details['payer']:
                payer_email = paypal_details['payer']['email_address']
            elif 'payer' in verified_paypal_order and 'email_address' in verified_paypal_order['payer']:
                payer_email = verified_paypal_order['payer']['email_address']
            else:
                payer_email = None

            if payer_email:
                # Check if this email has already used this coupon
                orders_ref = db.collection('orders')
                prior_orders = orders_ref.where('coupon_used', '==', coupon_code).where('payer_email', '==', payer_email).limit(1).stream()
                for _ in prior_orders:
                    print(f"Coupon '{coupon_code}' already used by {payer_email}")
                    return JsonResponse({'message': 'קופון זה כבר נוצל על ידי כתובת האימייל שלך.'}, status=400)

            coupons_ref = db.collection('coupons')
            coupon_query = coupons_ref.where('code', '==', coupon_code).where('isActive', '==', True).limit(1).stream()
            found_coupon = None
            for coupon_doc in coupon_query:
                found_coupon = coupon_doc.to_dict()
                break

            if found_coupon:
                expires_at = found_coupon.get('expiresAt')
                if expires_at and expires_at.timestamp() > datetime.datetime.now().timestamp():
                    discount_percentage = float(found_coupon.get('percentageOff', 0))
                    server_total *= (1 - discount_percentage / 100)
                    print(f"Applied {discount_percentage}% discount. New total: {server_total}")
                else:
                    print(f"Coupon '{coupon_code}' has expired.")
            else:
                print(f"Coupon '{coupon_code}' not found or is not active.")

        # NEW: Add shipping cost to server total
        if shipping_method == 'delivery' and server_total > 0 and server_total < 100:
            server_total += 20 # Add the standard shipping fee

        # 3. Validate server total against PayPal total
        paypal_amount = float(verified_paypal_order["purchase_units"][0]["amount"]["value"])
        
        # Use a small tolerance for floating point comparison
        if not -0.02 <= server_total - paypal_amount <= 0.02:
            print(f"CRITICAL: Amount mismatch for Order {paypal_order_id}. Client: {server_total:.2f}, PayPal: {paypal_amount}")
            return JsonResponse({'message': 'Order amount validation failed.'}, status=400)

        # 4. Prepare and save order data to Firestore
        purchase_unit = verified_paypal_order.get("purchase_units", [{}])[0]
        payer_info = verified_paypal_order.get("payer", {})
        
        order_data = {
            "order_id": paypal_order_id,
            "paypal_capture_id": purchase_unit.get("payments", {}).get("captures", [{}])[0].get("id"),
            "status": verified_paypal_order.get("status"),
            "amount": purchase_unit.get("amount"),
            "items": cart_items,
            "payer_email": payer_info.get("email_address"),
            "customer_name": f"{payer_info.get('name', {}).get('given_name', '')} {payer_info.get('name', {}).get('surname', '')}".strip(),
            "shipping_address": purchase_unit.get("shipping", {}).get("address", {}),
            "payment_time": verified_paypal_order.get("create_time"), # or update_time
            "created_at": firestore.SERVER_TIMESTAMP,
            "coupon_used": coupon_code if discount_percentage > 0 else None,
            "discount_percentage": discount_percentage,
            "shipping_method": shipping_method
        }

        db.collection('orders').add(order_data)
        
        # 5. Send confirmation emails
        try:
            send_order_emails(order_data)
        except Exception as e:
            # Log email error but don't fail the entire transaction
            print(f"ERROR: Could not send confirmation emails for order {paypal_order_id}: {e}")

        return JsonResponse({'message': 'Order created successfully', 'paypal_capture_id': order_data['paypal_capture_id']}, status=200)

    except json.JSONDecodeError:
        return JsonResponse({'message': 'Invalid JSON in request body.'}, status=400)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'message': f'An unexpected error occurred: {e}'}, status=500) 