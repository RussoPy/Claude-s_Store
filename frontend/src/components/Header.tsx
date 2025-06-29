import React, { useContext, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import './Header.css';

const Header = () => {
    const cartContext = useContext(CartContext);
    const cartItemsCount = cartContext?.cartItems.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const [clickCount, setClickCount] = useState(0);
    const navigate = useNavigate();
    const clickTimeout = useRef<NodeJS.Timeout | null>(null);

    const handleLogoClick = () => {
        const newClickCount = clickCount + 1;
        setClickCount(newClickCount);

        if (clickTimeout.current) {
            clearTimeout(clickTimeout.current);
        }

        if (newClickCount === 3) {
            navigate('/admin/login');
            setClickCount(0);
        } else {
            clickTimeout.current = setTimeout(() => {
                setClickCount(0);
            }, 500); // 500ms window for triple click
        }
    };

    return (
        <header className="header-main">
            <div className="header-content">
                <img src="/Claude-logo.jpg" alt="לוגו" className="header-logo-img center-logo" onClick={handleLogoClick} />
                <h1 className="header-title">
                    <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>המעדניה של קלוד</Link>
                </h1>
            </div>
        </header>
    );
};

export default Header;