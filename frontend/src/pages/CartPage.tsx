import React, { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { Product } from '../types/Product';

const CartPage: React.FC = () => {
    const cartContext = useContext(CartContext);
    const MINIMUM_PURCHASE = 100;

    if (!cartContext) {
        return <div style={{ textAlign: 'center', padding: '50px' }}>טוען...</div>;
    }

    const { cartItems, addToCart, decrementFromCart, removeFromCart, getCartTotal } = cartContext;

    const cartTotal = getCartTotal();
    const isCheckoutDisabled = cartTotal > 0 && cartTotal < MINIMUM_PURCHASE;

    return (
        <div className="cart-page">
            <h1>העגלה שלך</h1>

            {cartItems.length === 0 ? (
                <div className="cart-empty-container">
                    <p>העגלה ריקה.</p>
                    <Link to="/">
                        <button className="back-to-shop-btn">
                            חזור לחנות והמשך לקנות
                        </button>
                    </Link>
                </div>
            ) : (
                <div className="cart-container">
                    <div className="cart-items-list">
                        {cartItems.map(item => (
                            <div key={item.id} className="cart-item-card">
                                <img src={item.image} alt={item.name} className="cart-item-image" />
                                <div className="cart-item-info">
                                    <h3>{item.name}</h3>
                                    <p>₪{item.price.toFixed(2)}</p>
                                    <div className="quantity-controls">
                                        <button onClick={() => decrementFromCart(item.id)} aria-label={`הפחת כמות של ${item.name}`}>-</button>
                                        <span aria-live="polite">{item.quantity}</span>
                                        <button onClick={() => addToCart(item as Product)} aria-label={`הוסף עוד ${item.name}`}>+</button>
                                    </div>
                                    <p className="item-total-price">סה"כ: ₪{(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                                <button className="remove-item-btn" onClick={() => removeFromCart(item.id)} aria-label={`הסר את ${item.name} מהעגלה`}>הסר</button>
                            </div>
                        ))}
                    </div>

                    <div className="cart-summary-card">
                        <h2>סיכום הזמנה</h2>
                        <div className="summary-total">
                            <span>סה"כ:</span>
                            <span>₪{cartTotal.toFixed(2)}</span>
                        </div>
                        {isCheckoutDisabled && (
                            <p style={{ color: 'red', marginTop: '10px', fontWeight: 'bold' }}>
                                קנייה באתר מ-₪{MINIMUM_PURCHASE} ומעלה
                                <Link to="/">
                              <p style={{ color: 'blue', marginTop: '10px', fontWeight: 'bold' }}> המשך לקנות</p>
                            </Link>
                            </p>

                           
                        )}
                        <Link to="/checkout" style={{ textDecoration: 'none', pointerEvents: isCheckoutDisabled ? 'none' : 'auto' }}>
                            <button className="checkout-btn" disabled={isCheckoutDisabled}>המשך לתשלום</button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;