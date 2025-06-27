import firebase_admin
from firebase_admin import credentials, firestore
import os
import sys
from dotenv import load_dotenv

# Adjust the path to go up one level to find the 'backend' directory
# and then append it to the system path to allow module imports.
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(project_root)
load_dotenv(os.path.join(project_root, '.env'))


def initialize_firebase():
    """Initializes the Firebase Admin SDK using environment variables."""
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
            "universe_domain": os.getenv("UNIVERSE_DOMAIN"),
            "firebase_web_api_key": os.getenv("FIREBASE_WEB_API_KEY")
        }
        
        # Check if all required credentials are present
        if not all(creds.values()):
            print("Error: Missing one or more Firebase credentials in your .env file.")
            print("Required: TYPE, PROJECT_ID, PRIVATE_KEY_ID, PRIVATE_KEY, CLIENT_EMAIL, CLIENT_ID, AUTH_URI, TOKEN_URI, AUTH_PROVIDER_X509_CERT_URL, CLIENT_X509_CERT_URL, UNIVERSE_DOMAIN, FIREBASE_WEB_API_KEY")
            sys.exit(1)

        # Remove the web API key before initializing the admin SDK
        creds.pop("firebase_web_api_key")

        cred = credentials.Certificate(creds)
        firebase_admin.initialize_app(cred)
        print("Firebase initialized successfully.")
        return firestore.client()
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        sys.exit(1)

MENU_DATA = {
    "דגים מעושנים ומלוחים": [
        {"name": "מקרל מעושן קטן", "description": "דג מקרל מעושן שלם/חתוך נקי ומקולף", "price": 20, "quantity": 100, "imageUrl": ""},
        {"name": "מקרל מעושן גדול", "description": "דג מקרל מעושן שלם/חתוך נקי ומקולף", "price": 40, "quantity": 100, "imageUrl": ""},
        {"name": "סלמון מעושן", "description": "200 גרם, ארוז בוואקום", "price": 34, "quantity": 100, "imageUrl": ""},
        {"name": "טונה מעושנת בעישון חם", "description": "200 גרם", "price": 34, "quantity": 100, "imageUrl": ""},
        {"name": "טונה מעושנת בעישון קר מפולפלת", "description": "200 גרם", "price": 34, "quantity": 100, "imageUrl": ""},
        {"name": "מקרוסקה מעושנת", "description": "חבילה", "price": 30, "quantity": 100, "imageUrl": ""},
        {"name": "הרינג לבן", "description": "ליחידה", "price": 6, "quantity": 100, "imageUrl": ""},
        {"name": "הרינג אדום", "description": "ליחידה", "price": 6, "quantity": 100, "imageUrl": ""},
        {"name": "מטיאס אמיתי", "description": "ליחידה", "price": 10, "quantity": 100, "imageUrl": ""},
        {"name": "הרינג כבוש בחומץ", "description": "250 גרם", "price": 18, "quantity": 100, "imageUrl": ""},
        {"name": "סלט דג הרינג לבן", "description": "עם שמיר ובצל לבן", "price": 12, "quantity": 100, "imageUrl": ""},
        {"name": "סלט הרינג אדום", "description": "עם בצל ובצל ירוק", "price": 12, "quantity": 100, "imageUrl": ""},
        {"name": "מקרל חתוך פרוסות בשמן", "description": "קופסא", "price": 12, "quantity": 100, "imageUrl": ""},
        {"name": "סלט סלמון מעושן", "description": "עם בצל ופלפל חריף", "price": 12, "quantity": 100, "imageUrl": ""},
        {"name": "ביצי בורי בשעווה (בוטרגה)", "description": "50 ש״ח ל-100 גרם", "price": 50, "quantity": 100, "imageUrl": ""},
    ],
    "זיתים": [
        {"name": "זית טסוס יווני", "description": "250 גרם", "price": 16, "quantity": 100, "imageUrl": ""},
        {"name": "זית טסוס מרוקאי", "description": "250 גרם", "price": 16, "quantity": 100, "imageUrl": ""},
        {"name": "זית סורי מר", "description": "250 גרם", "price": 16, "quantity": 100, "imageUrl": ""},
        {"name": "זית סורי לא מר", "description": "250 גרם", "price": 16, "quantity": 100, "imageUrl": ""},
        {"name": "זית ירוק יווני מגולען ענק", "description": "250 גרם", "price": 16, "quantity": 100, "imageUrl": ""},
        {"name": "זית שחור יווני מגולען", "description": "250 גרם", "price": 16, "quantity": 100, "imageUrl": ""},
        {"name": "זית שחור שלם (ישראלי)", "description": "250 גרם", "price": 16, "quantity": 100, "imageUrl": ""},
        {"name": "זית ירוק מגולען חרוזית (ישראלי)", "description": "250 גרם", "price": 16, "quantity": 100, "imageUrl": ""},
        {"name": "זית ירוק מנזולינו (ישראלי)", "description": "250 גרם", "price": 16, "quantity": 100, "imageUrl": ""},
        {"name": "זית טבעי יווני", "description": "250 גרם", "price": 16, "quantity": 100, "imageUrl": ""},
        {"name": "זיתי קלמטה מגולענים", "description": "250 גרם", "price": 16, "quantity": 100, "imageUrl": ""},
        {"name": "זיתי קלמטה סוג ג׳אינט ענק", "description": "250 גרם", "price": 16, "quantity": 100, "imageUrl": ""},
        {"name": "זית סאנטה ענק", "description": "250 גרם", "price": 16, "quantity": 100, "imageUrl": ""},
        {"name": "זית סאנטה ענק עם טיבול", "description": "פלפל חריף, לימון ושמן זית", "price": 16, "quantity": 100, "imageUrl": ""},
        {"name": "זית סורי מטובל", "description": "שום כתוש, שמיר, שמן זית ולימון", "price": 16, "quantity": 100, "imageUrl": ""},
        {"name": "מיקס זיתי הבית", "description": "250 גרם", "price": 16, "quantity": 100, "imageUrl": ""},
        {"name": "זית מטובל בטוסטר", "description": "250 גרם", "price": 16, "quantity": 100, "imageUrl": ""},
        {"name": "זית איטלקי סרניולה", "description": "250 גרם", "price": 16, "quantity": 100, "imageUrl": ""},
        {"name": "זית ירוק ממולא פלפל חריף יווני", "description": "250 גרם", "price": 16, "quantity": 100, "imageUrl": ""},
        {"name": "זית ירוק ממולא שום יווני", "description": "250 גרם", "price": 16, "quantity": 100, "imageUrl": ""},
    ],
    "חמוצים": [
        {"name": "מלפפון חמוץ ביתי", "description": "250 גרם", "price": 10, "quantity": 100, "imageUrl": ""},
        {"name": "מלפפון חמוץ ביתי", "description": "500 גרם", "price": 20, "quantity": 100, "imageUrl": ""},
        {"name": "כרובית עם גזר (תרשי)", "description": "250 גרם", "price": 10, "quantity": 100, "imageUrl": ""},
        {"name": "כרובית עם גזר (תרשי)", "description": "500 גרם", "price": 20, "quantity": 100, "imageUrl": ""},
        {"name": "שיפקונית", "description": "250 גרם", "price": 15, "quantity": 100, "imageUrl": ""},
        {"name": "שיפקה", "description": "250 גרם", "price": 15, "quantity": 100, "imageUrl": ""},
        {"name": "חציל מוחמץ", "description": "250 גרם", "price": 15, "quantity": 100, "imageUrl": ""},
    ],
    "ממרחים": [
        {"name": "עמבה הודית אמיתית", "description": "250 גרם", "price": 15, "quantity": 100, "imageUrl": ""},
        {"name": "לימון כבוש ביתי", "description": "קופסא", "price": 15, "quantity": 100, "imageUrl": ""},
        {"name": "לימון כבוש טחון ביתי", "description": "קופסא", "price": 15, "quantity": 100, "imageUrl": ""},
        {"name": "איקרא מצוינת", "description": "250 גרם", "price": 20, "quantity": 100, "imageUrl": ""},
        {"name": "סחוג ירוק חריף אש", "description": "קופסא", "price": 15, "quantity": 100, "imageUrl": ""},
    ]
}

def populate_data(db):
    """Populates Firestore with categories and products from MENU_DATA."""
    products_collection = db.collection('products')
    categories_collection = db.collection('categories')
    
    print("Starting data population...")

    # Clear existing data to prevent duplicates on re-running
    print("Clearing existing data...")
    for doc in products_collection.stream():
        doc.reference.delete()
    for doc in categories_collection.stream():
        doc.reference.delete()
    print("Cleared existing categories and products.")

    total_products = 0
    for category_name, products in MENU_DATA.items():
        # Create category document and get its reference
        category_doc_ref = categories_collection.document()
        category_doc_ref.set({'name': category_name})
        print(f"Created category: '{category_name}'")

        for product_data in products:
            # Add product data and include a reference to its category
            product_data_with_ref = product_data.copy()
            product_data_with_ref['categoryRef'] = category_doc_ref
            products_collection.add(product_data_with_ref)
            total_products += 1
            print(f"  - Added product: {product_data['name']}")

    print("\nPopulation complete!")
    print(f"Added {len(MENU_DATA)} categories and a total of {total_products} products to Firestore.")


if __name__ == "__main__":
    db_client = initialize_firebase()
    populate_data(db_client) 