import React, { useState, useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import { CartProvider, CartContext } from './context/CartContext';
import './App.css';

const FloatingCartButton = () => {
  const location = useLocation();
  const cartContext = useContext(CartContext);
  if (!cartContext || location.pathname === '/cart') return null;
  const { cartItems } = cartContext;
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link to="/cart" style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      background: '#1a9da1',
      color: 'white',
      borderRadius: '50%',
      width: '60px',
      height: '60px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '24px',
      textDecoration: 'none',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      zIndex: 1000
    }}>
      🛒
      {itemCount > 0 && (
        <span style={{
          position: 'absolute',
          top: '-5px',
          right: '-5px',
          background: 'red',
          borderRadius: '50%',
          width: '25px',
          height: '25px',
          fontSize: '14px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {itemCount}
        </span>
      )}
    </Link>
  );
};

const ProductAddedIndicator = ({ show, type }: { show: boolean, type: 'add' | 'remove' }) => (
  show ? (
    <div style={{
      position: 'fixed',
      top: 30,
      right: 30,
      background: type === 'add' ? '#1a9da1' : '#e74c3c',
      color: '#fff',
      padding: '16px 32px',
      borderRadius: '8px',
      fontSize: '1.2rem',
      zIndex: 9999,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
    }}>
      {type === 'add' ? 'מוצר נוסף לעגלה!' : 'מוצר הוסר מהעגלה!'}
    </div>
  ) : null
);

function App() {
  const [showIndicator, setShowIndicator] = useState(false);
  const [indicatorType, setIndicatorType] = useState<'add' | 'remove'>('add');

  // Provide a function to trigger the indicator
  const triggerIndicator = (type: 'add' | 'remove') => {
    setIndicatorType(type);
    setShowIndicator(true);
    setTimeout(() => setShowIndicator(false), 1200);
  };

  return (
    <CartProvider>
      <Router>
        <ProductAddedIndicator show={showIndicator} type={indicatorType} />
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage onProductAdd={() => triggerIndicator('add')} onProductRemove={() => triggerIndicator('remove')} />} />
            <Route path="/cart" element={<CartPage onProductRemove={() => triggerIndicator('remove')} onProductAdd={() => triggerIndicator('add')} />} />
            <Route path="/checkout" element={<CheckoutPage />} />
          </Routes>
        </main>
        <Footer />
        <FloatingCartButton />
      </Router>
    </CartProvider>
  );
}

export default App;
