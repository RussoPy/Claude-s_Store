import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

const FloatingCartButton = () => {
    const location = useLocation();
    const cartContext = useContext(CartContext);
    const [isAtBottom, setIsAtBottom] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const isBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight;
            setIsAtBottom(isBottom);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!cartContext || location.pathname === '/cart' || location.pathname === '/checkout') {
        return null;
    }

    const { cartItems } = cartContext;
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const buttonStyle: React.CSSProperties = {
        position: 'fixed',
        bottom: isAtBottom ? '400px' : '30px',
        left: '30px',
        background: '#1a9da1',
        color: 'white',
        borderRadius: '50%',
        width: '70px',
        height: '70px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '30px',
        textDecoration: 'none',
        boxShadow: '0 6px 12px rgba(0,0,0,0.25)',
        zIndex: 1000,
        outline: '3px solid white',
        transition: 'bottom 0.3s ease-in-out',
    };

    return (
        <Link to="/cart" style={buttonStyle}>
            🛒
            {itemCount > 0 && (
                <span style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    background: 'red',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    fontSize: '16px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontWeight: 'bold',
                }}>
                    {itemCount}
                </span>
            )}
        </Link>
    );
};

export default FloatingCartButton; 