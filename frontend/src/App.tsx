import React, { useState, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminLoginPage from './pages/AdminLoginPage';
import ThankYouPage from './pages/ThankYouPage';
import { CartProvider } from './context/CartContext';
import FloatingCartButton from './components/FloatingCartButton';
import './App.css';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import ScrollToTop from './components/ScrollToTop';

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
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const adminDocRef = doc(db, 'admins', user.uid);
        const adminDoc = await getDoc(adminDocRef);
        setIsAdmin(adminDoc.exists());
      } else {
        setIsAdmin(false);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Provide a function to trigger the indicator
  const triggerIndicator = (type: 'add' | 'remove') => {
    setIndicatorType(type);
    setShowIndicator(true);
    setTimeout(() => setShowIndicator(false), 1200);
  };

  return (
    <CartProvider>
      <Router>
        <ScrollToTop />
        <ProductAddedIndicator show={showIndicator} type={indicatorType} />
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage onProductAdd={() => triggerIndicator('add')} onProductRemove={() => triggerIndicator('remove')} isAdmin={isAdmin} authLoading={authLoading} />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/thankyou" element={<ThankYouPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
          </Routes>
        </main>
        <Footer />
        {!isAdmin && <FloatingCartButton />}
      </Router>
    </CartProvider>
  );
}

export default App;
