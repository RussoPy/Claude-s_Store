import React, { useState, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminLoginPage from './pages/AdminLoginPage';
import ThankYouPage from './pages/ThankYouPage';
import TermsPage from './pages/TermsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import AccessibilityStatementPage from './pages/AccessibilityStatementPage';
import { CartProvider } from './context/CartContext';
import FloatingCartButton from './components/FloatingCartButton';
import CouponModal from './components/CouponModal';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { AccessibilityProvider, useAccessibility } from './context/AccessibilityContext';
import { AccessibilityMenu } from './components/AccessibilityMenu';
import ScrollToTop from './components/ScrollToTop';
import ContactPage from './pages/ContactPage';
import './App.css';

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
  return (
    <AccessibilityProvider>
      <AppWrapper />
    </AccessibilityProvider>
  );
}

function AppWrapper() {
  const { settings } = useAccessibility();
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);
  const [indicatorType, setIndicatorType] = useState<'add' | 'remove'>('add');


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


  const handleLogout = () => {
    signOut(auth);
  };

  const triggerIndicator = (type: 'add' | 'remove') => {
    setIndicatorType(type);
    setShowIndicator(true);
    setTimeout(() => setShowIndicator(false), 1200);
  };

  const classNames = [
    settings.highContrast ? 'high-contrast' : '',
    settings.underlineLinks ? 'underline-links' : '',
    settings.grayscale ? 'grayscale' : '',
    settings.readableFont ? 'readable-font' : '',
    settings.invertColors ? 'invert-colors' : '',
    settings.highlightHeadings ? 'highlight-headings' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames} style={{ fontSize: `${settings.fontSizeMultiplier}rem` }}>
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
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/thankyou" element={<ThankYouPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/accessibility-statement" element={<AccessibilityStatementPage />} />
              <Route path="/contact" element={<ContactPage />} />
            </Routes>
          </main>
          <Footer />
          {!isAdmin && <FloatingCartButton />}
          {isAdmin && <button onClick={() => setShowCouponModal(true)}>נהל קופונים</button>}
          <CouponModal show={showCouponModal} onHide={() => setShowCouponModal(false)} />
          {isAdmin && <button onClick={handleLogout}>התנתק</button>}
          <AccessibilityMenu />
        </Router>
      </CartProvider>
    </div>
  );
}


export default App;
