import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

const CartPreview = () => {
    const cartContext = useContext(CartContext);

    if (!cartContext) {
        return null;
    }

    const { isCartOpen, cartItems, addToCart, decrementFromCart, getCartTotal, toggleCart } = cartContext;

    return (
        <div className={`cart-preview ${isCartOpen ? 'open' : ''}`}>
            <div className="cart-preview-header">
                <h3>Your Cart</h3>
                <button onClick={toggleCart} className="close-btn">&times;</button>
            </div>
            <div className="cart-preview-items">
                {cartItems.length === 0 ? (
                    <p>Your cart is empty.</p>
                ) : (
                    cartItems.map(item => (
                        <div key={item.id} className="cart-preview-item">
                            <img src={item.image} alt={item.name} />
                            <div className="item-details">
                                <h4>{item.name}</h4>
                                <p>${item.price.toFixed(2)}</p>
                                <div className="quantity-control">
                                    <button onClick={() => decrementFromCart(item.id)}>-</button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => addToCart(item)}>+</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {cartItems.length > 0 && (
                <div className="cart-preview-footer">
                    <div className="total">
                        <h4>Subtotal:</h4>
                        <h4>${getCartTotal().toFixed(2)}</h4>
                    </div>
                    <Link to="/cart" onClick={toggleCart}>
                        <button className="view-cart-btn">View Cart</button>
                    </Link>
                </div>
            )}
        </div>
    );
};

export default CartPreview; 