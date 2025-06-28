import React, { useContext, useEffect } from 'react';
import { CartContext } from '../context/CartContext';
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { useNavigate } from 'react-router-dom';

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

  if (!cartContext) {
    return <div>טוען...</div>;
  }

  const { getCartTotal, clearCart, cartItems } = cartContext;

  const createOrder = (data: any, actions: any) => {
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            currency_code: "ILS",
            value: getCartTotal().toFixed(2),
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
            cartItems: cartItems
          })
        });

        const orderData = await response.json();

        if (response.ok) {
          const displayId = orderData.paypal_capture_id || details.id;
          alert(`תודה על ההזמנה!\n\nההזמנה התקבלה בהצלחה.\n\nמספר עסקה לאישור:\n${displayId}`);
          clearCart();
          navigate('/');
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
          <div className="order-summary">
            <h2>סיכום הזמנה</h2>
            <p>סה"כ: ₪{getCartTotal().toFixed(2)}</p>
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