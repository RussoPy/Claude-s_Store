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
const PayPalCheckoutButton = ({ createOrder, onApprove, onError, onCancel, disabled }: any) => {
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
        disabled={isPending || disabled}
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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [shippingMethod, setShippingMethod] = useState('pickup'); // 'pickup' or 'delivery'
  const [shippingCost, setShippingCost] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const { getCartTotal, clearCart, cartItems } = cartContext || {};

  const SHIPPING_FEE = 20;
  const FREE_SHIPPING_THRESHOLD = 200;
  const MINIMUM_PURCHASE = 100;

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
            value: finalTotal.toFixed(2),
          },
        },
      ],
    });
  };

  const onApprove = (data: any, actions: any) => {
    setIsProcessing(true);
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
          setIsProcessing(false);
          throw new Error(orderData.message || 'שגיאה בשמירת ההזמנה');
        }

      } catch (error) {
        console.error("Error saving order: ", error);
        alert('   אירעה שגיאה בשליחת ההזמנה. אנא צור קשר עם שירות הלקוחות.');
        setIsProcessing(false);
      }
    });
  };

  const onError = (err: any) => {
    console.error("PayPal Checkout onError - Full error details:", err);
    console.error("Error message:", err?.message);
    console.error("Error code:", err?.code);
    console.error("Error details:", err?.details);
    alert(`PayPal Error: ${err?.message || 'אירעה שגיאה במהלך התשלום'}`);
    setIsProcessing(false);
  }

  const onCancel = (data: any) => {
    // This function is called when the user closes the PayPal popup.
    // We log it for debugging purposes but don't show an error to the user.
    console.log("PayPal payment cancelled by user.", data);
    setIsProcessing(false);
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
      {isProcessing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          flexDirection: 'column',
          backdropFilter: 'blur(5px)',
        }}>
          {/* Assuming a global .loading-spinner class exists for the animation */}
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '20px', fontSize: '1.5em', color: '#333', fontWeight: 500 }}>
            מאמת את התשלום... נא להמתין.
          </p>
        </div>
      )}
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
              <p style={{ fontSize: '0.9em', color: '#6c757d', marginTop: '5px' }}>{`משלוח חינם בהזמנה מעל ₪${FREE_SHIPPING_THRESHOLD}. זמן אספקה: 3-4 ימי עסקים.`}</p>
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
            <div className="form-check my-3" style={{ textAlign: 'right' }}>
              <input
                className="form-check-input"
                style={{ float: 'right', marginLeft: '10px' }}
                type="checkbox"
                id="termsAndConditions"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="termsAndConditions">
                קראתי והבנתי את <a href="/terms" target="_blank" rel="noopener noreferrer">תנאי השימוש</a>
              </label>
            </div>
            {finalTotal < MINIMUM_PURCHASE && finalTotal > 0 && (
              <p style={{ color: 'red', fontWeight: 'bold', textAlign: 'center' }}>
                סכום ההזמנה המינימלי הוא ₪{MINIMUM_PURCHASE}.
              </p>
            )}
            <PayPalCheckoutButton
              createOrder={createOrder}
              onApprove={onApprove}
              onError={onError}
              onCancel={onCancel}
              disabled={!termsAccepted || finalTotal < MINIMUM_PURCHASE}
            />
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
};

export default CheckoutPage;