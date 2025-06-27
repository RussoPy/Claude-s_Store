import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

const Header = () => {
    const cartContext = useContext(CartContext);
    const cartItemsCount = cartContext?.cartItems.reduce((sum, item) => sum + item.quantity, 0) || 0;

    return (
        <header>
            <div className="logo">
                <Link to="/">Foodies</Link>
            </div>
            <nav>
                <Link to="/cart">
                    Cart ({cartItemsCount})
                </Link>
            </nav>
        </header>
    );
};

export default Header; 