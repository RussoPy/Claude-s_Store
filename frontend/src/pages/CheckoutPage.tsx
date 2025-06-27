import React, { useContext } from 'react';
import { CartContext } from '../context/CartContext';

const CheckoutPage = () => {
  const cartContext = useContext(CartContext);

  if (!cartContext) {
    return <div>Loading...</div>;
  }

  const { getCartTotal, clearCart } = cartContext;

  const handleCheckout = () => {
    // In a real app, you would integrate with a payment gateway here.
    alert('Thank you for your order!');
    clearCart();
  };

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>
      <div className="order-summary">
        <h2>Order Summary</h2>
        <p>Total: ${getCartTotal().toFixed(2)}</p>
      </div>
      <div className="checkout-form">
        <h2>Shipping Information</h2>
        <form>
          <input type="text" placeholder="Full Name" required />
          <input type="email" placeholder="Email" required />
          <input type="text" placeholder="Address" required />
          <input type="text" placeholder="City" required />
          <input type="text" placeholder="Postal Code" required />
          <button type="button" onClick={handleCheckout}>
            Place Order
          </button>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage; 