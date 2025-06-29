import React, { useContext, useEffect, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Coupon } from '../types/Coupon';
import ThankYouPage from './ThankYouPage';

// Custom component to handle the loading state of the PayPal script
const PayPalCheckoutButton = ({ createOrder, onApprove, onError }: any) => {
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
  const { getCartTotal, clearCart, cartItems } = cartContext || {};

  useEffect(() => {
    if (getCartTotal) {
      setFinalTotal(getCartTotal());
    }
  }, [cartItems, getCartTotal]);

  if (!cartContext) {
    return <div>טוען...</div>;
  }

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setCouponMessage('');
    setDiscountAmount(0);

    const couponsRef = collection(db, 'coupons');
    const q = query(couponsRef, where("code", "==", couponCode.trim()), where("isActive", "==", true));

    try {
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setCouponMessage('קופון לא חוקי');
        setFinalTotal(getCartTotal!());
        return;
      }

      const coupon = querySnapshot.docs[0].data() as Coupon;

      if (coupon.expiresAt.toDate() < new Date()) {
        setCouponMessage('הקופון פג תוקף');
        setFinalTotal(getCartTotal!());
        return;
      }

      const total = getCartTotal!();
      const discount = (total * coupon.percentageOff) / 100;
      setDiscountAmount(discount);
      setFinalTotal(total - discount);
      setCouponMessage(`הנחה של ${coupon.percentageOff}% הופעלה!`);

    } catch (error) {
      setCouponMessage('שגיאה באימות הקופון');
      setFinalTotal(getCartTotal!());
    }
  };

  const createOrder = (data: any, actions: any) => {
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            currency_code: "ILS",
            value: finalTotal.toFixed(2),
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
            finalTotal: finalTotal.toFixed(2)
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

  return (
    <PayPalScriptProvider options={{ clientId: process.env.REACT_APP_PAYPAL_CLIENT_ID || "test", currency: "ILS" }}>
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
                <input type="text" className="form-control" placeholder="קוד קופון" value={couponCode} onChange={e => setCouponCode(e.target.value)} />
                <button className="btn btn-outline-secondary" type="button" onClick={handleApplyCoupon}>החל</button>
              </div>
              {couponMessage && <p className={`mt-2 ${discountAmount > 0 ? 'text-success' : 'text-danger'}`}>{couponMessage}</p>}
            </div>
            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'red' }}>
                <span>הנחה:</span>
                <span>-₪{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <hr />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2em' }}>
              <span>סה"כ לתשלום:</span>
              <span>₪{finalTotal.toFixed(2)}</span>
            </div>
          </div>
          <div style={{ marginTop: '20px', zIndex: 0 }}>
            <PayPalCheckoutButton
              createOrder={createOrder}
              onApprove={onApprove}
              onError={onError}
            />
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
};

export default CheckoutPage;