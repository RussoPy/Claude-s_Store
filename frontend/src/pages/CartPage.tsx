import React, { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { Link } from 'react-router-dom';

const CartPage = () => {
    const cartContext = useContext(CartContext);

    if (!cartContext) {
        return <div>Loading...</div>;
    }

    const { cartItems, addToCart, decrementFromCart, removeFromCart, getCartTotal } = cartContext;

    return (
        <div className="cart-page">
            <h1>Your Cart</h1>
            {cartItems.length === 0 ? (
                <p>Your cart is empty.</p>
            ) : (
                <>
                    <div className="cart-items">
                        {cartItems.map(item => (
                            <div key={item.id} className="cart-item">
                                <img src={item.image} alt={item.name} />
                                <div className="cart-item-details">
                                    <h3>{item.name}</h3>
                                    <p>${item.price.toFixed(2)}</p>
                                    <div className="quantity-control">
                                        <button onClick={() => decrementFromCart(item.id)}>-</button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => addToCart(item)}>+</button>
                                    </div>
                                    <button onClick={() => removeFromCart(item.id)}>Remove</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="cart-summary">
                        <h2>Total: ${getCartTotal().toFixed(2)}</h2>
                        <Link to="/checkout">
                            <button>Proceed to Checkout</button>
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
};

export default CartPage; 