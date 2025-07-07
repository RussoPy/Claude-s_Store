import React, { useContext, useEffect, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { Coupon } from '../types/Coupon';
import ThankYouPage from './ThankYouPage';
import { getGuestSessionId } from '../utils/guestSession';
import { rateLimiter } from '../utils/rateLimiter';

// Custom component to handle the loading state of the PayPal script
const PayPalCheckoutButton = ({ createOrder, onApprove, onError, onCancel }: any) => {
  const [{ isPending }, dispatch] = usePayPalScriptReducer();

  useEffect(() => {
    // You can dispatch actions to change script loading options here if needed
  }, []);

  return (
    <>
      {isPending && <div className="loading-spinner">טוען תשלום...</div>}
      <PayPalButtons
        style={{ layout: "vertical" }}
        createOrder={createOrder}
        onApprove={onApprove}
        onError={onError}
        onCancel={onCancel}
        disabled={isPending}
      />
    </>
  );
};

const CheckoutPage = () => {
  const cartContext = useContext(CartContext);
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [finalTotal, setFinalTotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [shippingMethod, setShippingMethod] = useState('pickup'); // 'pickup' or 'delivery'
  const [shippingCost, setShippingCost] = useState(0);
  const { getCartTotal, clearCart, cartItems } = cartContext || {};

  const SHIPPING_FEE = 20;
  const FREE_SHIPPING_THRESHOLD = 100;

  useEffect(() => {
    if (!getCartTotal) return;

    const cartTotal = getCartTotal();
    const totalAfterDiscount = cartTotal - discountAmount;

    let currentShippingCost = 0;
    // Add shipping fee if delivery is selected and total is under the threshold
    if (shippingMethod === 'delivery' && totalAfterDiscount > 0 && totalAfterDiscount < FREE_SHIPPING_THRESHOLD) {
      currentShippingCost = SHIPPING_FEE;
    }
    setShippingCost(currentShippingCost);

    setFinalTotal(totalAfterDiscount + currentShippingCost);
  }, [cartItems, getCartTotal, discountAmount, shippingMethod]);

  if (!cartContext) {
    return <div>טוען...</div>;
  }

  const handleApplyCoupon = async () => {
    if (!rateLimiter.canRun('applyCoupon')) return;
    if (!couponCode) return;
    setCouponMessage('');
    setDiscountAmount(0);

    const couponsRef = collection(db, 'coupons');
    const q = query(couponsRef, where("code", "==", couponCode.trim()), where("isActive", "==", true));

    try {
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setCouponMessage('קופון לא חוקי');
        setDiscountAmount(0);
        return;
      }

      const coupon = querySnapshot.docs[0].data() as Coupon;

      if (coupon.expiresAt.toDate() < new Date()) {
        setCouponMessage('הקופון פג תוקף');
        setDiscountAmount(0);
        return;
      }

      const total = getCartTotal!();
      const discount = (total * coupon.percentageOff) / 100;
      setDiscountAmount(discount);
      setCouponMessage(`הנחה של ${coupon.percentageOff}% הופעלה!`);

    } catch (error) {
      setCouponMessage('שגיאה באימות הקופון');
      setDiscountAmount(0);
    }
  };

  // Fetch cart from Firestore before creating PayPal order
  const fetchCartFromFirestore = async () => {
    const sessionId = getGuestSessionId();
    const cartDocRef = doc(db, 'carts', sessionId);
    const cartSnap = await getDoc(cartDocRef);
    if (cartSnap.exists()) {
      return cartSnap.data().items || [];
    }
    return [];
  };

  const createOrder = async (data: any, actions: any) => {
    if (!rateLimiter.canRun('checkout')) return Promise.reject(new Error('Too many attempts. Please wait.'));
    // Fetch latest cart from Firestore and compare
    const firestoreCart = await fetchCartFromFirestore();
    if (!firestoreCart.length) {
      alert('העגלה שלך ריקה.');
      return Promise.reject(new Error('Empty cart.'));
    }
    // Optionally: compare firestoreCart to cartItems and show warning if mismatch
    // (for now, just use firestoreCart for the order)
    const total = firestoreCart.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    if (typeof total !== 'number' || total <= 0) {
      alert('סכום ההזמנה אינו תקין.');
      return Promise.reject(new Error('Invalid total.'));
    }
    // Use the total from Firestore for PayPal
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            currency_code: 'ILS',
            value: total.toFixed(2),
          },
        },
      ],
    });
  };

  const onApprove = (data: any, actions: any) => {
    return actions.order.capture().then(async (details: any) => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL;
        const response = await fetch(`${backendUrl}/api/orders/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paypalDetails: details,
            cartItems: cartItems,
            couponCode: couponCode,
            finalTotal: finalTotal.toFixed(2),
            shippingMethod: shippingMethod
          })
        });

        const orderData = await response.json();

        if (response.ok) {
          const displayId = orderData.paypal_capture_id || details.id;
          navigate('/thankyou', {
            state: {
              order: {
                transactionId: displayId,
                finalTotal: finalTotal.toFixed(2),
                cartItems: cartItems,
                couponCode: couponCode || null
              }
            }
          });
          setTimeout(() => {
            cartContext.clearCart();
          }, 500);
        } else {
          throw new Error(orderData.message || 'שגיאה בשמירת ההזמנה');
        }

      } catch (error) {
        console.error("Error saving order: ", error);
        alert('   אירעה שגיאה בשליחת ההזמנה. אנא צור קשר עם שירות הלקוחות.');
      }
    });
  };

  const onError = (err: any) => {
    console.error("PayPal Checkout onError", err);
    alert('אירעה שגיאה במהלך התשלום.');
  }

  const onCancel = (data: any) => {
    // This function is called when the user closes the PayPal popup.
    // We log it for debugging purposes but don't show an error to the user.
    console.log("PayPal payment cancelled by user.", data);
  };

  const clientId = process.env.REACT_APP_PAYPAL_CLIENT_ID;

  if (!clientId) {
    return (
      <div className="checkout-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{ maxWidth: '500px', textAlign: 'center', padding: '20px', background: '#f8d7da', color: '#721c24', borderRadius: '8px' }}>
          <h2>שגיאת תצורה</h2>
          <p>שירות התשלומים אינו מוגדר כראוי. אנא פנה לתמיכת האתר.</p>
        </div>
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={{ clientId: clientId, currency: "ILS" }}>
      <div className="checkout-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
          <h1>תשלום</h1>
          <div className="order-summary" style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
            <h2>סיכום הזמנה</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>סה"כ ביניים:</span>
              <span>₪{cartContext.getCartTotal().toFixed(2)}</span>
            </div>
            <div className="coupon-area" style={{ margin: '15px 0' }}>
              <div className="input-group">
                <label htmlFor="coupon-code" className="visually-hidden">קוד קופון</label>
                <input id="coupon-code" type="text" className="form-control" placeholder="קוד קופון" value={couponCode} onChange={e => setCouponCode(e.target.value)} aria-describedby="coupon-message" />
                <button className="btn btn-outline-secondary" type="button" onClick={handleApplyCoupon}>החל</button>
              </div>
              <div id="coupon-message" role="status" aria-live="polite">
                {couponMessage && <p className={`mt-2 ${discountAmount > 0 ? 'text-success' : 'text-danger'}`}>{couponMessage}</p>}
              </div>
            </div>
            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'red' }}>
                <span>הנחה:</span>
                <span>-₪{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="shipping-options" style={{ marginTop: '20px', textAlign: 'right' }}>
              <h5 style={{ marginBottom: '10px' }}>אפשרויות משלוח</h5>
              <div className="form-check">
                <input className="form-check-input" style={{ float: 'right', marginLeft: '10px' }} type="radio" name="shippingOptions" id="pickup" value="pickup" checked={shippingMethod === 'pickup'} onChange={(e) => setShippingMethod(e.target.value)} />
                <label className="form-check-label" htmlFor="pickup">
                  איסוף עצמי (חינם)
                </label>
              </div>
              <div className="form-check">
                <input className="form-check-input" style={{ float: 'right', marginLeft: '10px' }} type="radio" name="shippingOptions" id="delivery" value="delivery" checked={shippingMethod === 'delivery'} onChange={(e) => setShippingMethod(e.target.value)} />
                <label className="form-check-label" htmlFor="delivery">
                  משלוח עד הבית
                </label>
              </div>
              <p style={{ fontSize: '0.9em', color: '#6c757d', marginTop: '5px' }}>משלוח חינם בהזמנה מעל ₪100. זמן אספקה: 3-4 ימי עסקים.</p>
            </div>
            {shippingMethod === 'delivery' && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>דמי משלוח:</span>
                <span>₪{shippingCost.toFixed(2)}</span>
              </div>
            )}
            <hr />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2em' }} role="status" aria-live="polite">
              <span>סה"כ לתשלום:</span>
              <span>₪{finalTotal.toFixed(2)}</span>
            </div>
          </div>
          <div style={{ marginTop: '20px', zIndex: 0 }}>
            <PayPalCheckoutButton
              createOrder={createOrder}
              onApprove={onApprove}
              onError={onError}
              onCancel={onCancel}
            />
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
};

export default CheckoutPage;