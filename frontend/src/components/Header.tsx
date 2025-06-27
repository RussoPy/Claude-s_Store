import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import './Header.css';

const Header = () => {
    const cartContext = useContext(CartContext);
    const cartItemsCount = cartContext?.cartItems.reduce((sum, item) => sum + item.quantity, 0) || 0;

    return (
        <header className="header-main">
            <div className="header-content">
                <img src="/claude-logo.png" alt="לוגו" className="header-logo-img" />
                <h1 className="header-title">
                    <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>המעדניה של קלוד</Link>
                </h1>
            </div>
        </header>
    );
};

export default Header;