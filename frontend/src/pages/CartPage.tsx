import React, { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { CartItem } from '../types/CartItem';

interface CartPageProps {
    onProductRemove?: () => void;
    onProductAdd?: () => void;
}

const CartPage: React.FC<CartPageProps> = ({ onProductRemove, onProductAdd }) => {
    const cartContext = useContext(CartContext);

    if (!cartContext) {
        return <div>טוען...</div>;
    }

    const { cartItems, addToCart, decrementFromCart, removeFromCart, getCartTotal } = cartContext;

    const groupedCartItems = cartItems.reduce((acc, item) => {
        const existingItem = acc.find(i => i.id === item.id);
        if (existingItem) {
            existingItem.quantity += item.quantity;
        } else {
            acc.push({ ...item });
        }
        return acc;
    }, [] as CartItem[]);

    return (
        <div className="cart-page">


            <div style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 1000 }}>

                <div className="cart-summary">
                    <h2>סה"כ: ₪{getCartTotal().toFixed(2)}</h2>
                </div>

                <Link to="/checkout">
                    <button>המשך לתשלום</button>
                </Link>
            </div>
            <h1>העגלה שלך</h1>
            {cartItems.length === 0 ? (
                <p>העגלה ריקה.</p>
            ) : (
                <>
                    <div className="cart-items">
                        {groupedCartItems.map(item => (
                            <div key={item.id} className="cart-item">
                                <img src={item.image} alt={item.name} />
                                <div className="cart-item-details">
                                    <h3>{item.name}</h3>
                                    <p>₪{item.price.toFixed(2)}</p>
                                    <div className="quantity-control" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <button className="quantity-btn" style={{ fontSize: '0.9em', width: 28, height: 28, minWidth: 0, padding: 0 }} onClick={() => { decrementFromCart(item.id); if (onProductRemove) onProductRemove(); }}>-</button>
                                        <span style={{ minWidth: 24, textAlign: 'center', display: 'inline-block' }}>{item.quantity}</span>
                                        <button className="quantity-btn" style={{ fontSize: '0.9em', width: 28, height: 28, minWidth: 0, padding: 0 }} onClick={() => { addToCart(item); if (onProductAdd) onProductAdd(); }}>+</button>
                                    </div>
                                    <p>סה"כ: ₪{(item.price * item.quantity).toFixed(2)}</p>
                                    <button onClick={() => { removeFromCart(item.id); if (onProductRemove) onProductRemove(); }}>הסר</button>
                                </div>
                            </div>
                        ))}
                    </div>

                </>
            )}
        </div>
    );
};

export default CartPage;