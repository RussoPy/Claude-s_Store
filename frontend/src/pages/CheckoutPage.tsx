import React, { useContext } from 'react';
import { CartContext } from '../context/CartContext';

const CheckoutPage = () => {
  const cartContext = useContext(CartContext);

  if (!cartContext) {
    return <div>טוען...</div>;
  }

  const { getCartTotal, clearCart } = cartContext;

  const handleCheckout = () => {
    // In a real app, you would integrate with a payment gateway here.
    alert('תודה על ההזמנה!');
    clearCart();
  };

  return (
    <div className="checkout-page">
      <h1>תשלום</h1>
      <div className="order-summary">
        <h2>סיכום הזמנה</h2>
        <p>סה"כ: ₪{getCartTotal().toFixed(2)}</p>
      </div>
      <div className="checkout-form">
        <h2>פרטי משלוח</h2>
        <form>
          <input type="text" placeholder="שם מלא" required />
          <input type="email" placeholder="אימייל" required />
          <input type="text" placeholder="כתובת" required />
          <input type="text" placeholder="עיר" required />
          <input type="text" placeholder="מיקוד" required />
          <button type="button" onClick={handleCheckout}>
            בצע הזמנה
          </button>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;