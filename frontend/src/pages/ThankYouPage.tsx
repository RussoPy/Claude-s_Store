import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ThankYouPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  if (!order) {
    // If no order details, redirect to home
    navigate('/');
    return null;
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', direction: 'rtl', textAlign: 'center', background: 'linear-gradient(135deg, #e0f7fa 0%, #f8fafb 100%)' }}>
      <div style={{ background: '#fff', borderRadius: 18, padding: 36, maxWidth: 520, margin: '0 auto', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', border: '1.5px solid #1a9da1' }}>
        <h1 style={{ color: '#1a9da1', marginBottom: 18, fontWeight: 800, fontSize: '2.2em' }}>תודה על ההזמנה!</h1>
        <h2 style={{ marginBottom: 18, color: '#222', fontWeight: 700 }}>ההזמנה התקבלה בהצלחה</h2>
        <div style={{ marginBottom: 18, color: '#0e5a5e', fontWeight: 500, fontSize: '1.1em' }}>
          זמן הכנת ההזמנה הוא 3-4 ימים. נעדכן אותך כשההזמנה מוכנה לאיסוף.פירוט הזמנה נשלח למייל שלך.
        </div>
        <div style={{ border: '1px dashed #1a9da1', borderRadius: 12, padding: 18, background: '#f8fafb', marginBottom: 18 }}>
          <h3 style={{ marginBottom: 12, color: '#1a9da1', fontWeight: 700 }}>פרטי ההזמנה שלך</h3>
          <div style={{ textAlign: 'right', marginBottom: 10 }}><strong>מספר עסקה:</strong> {order.transactionId}</div>
          <div style={{ textAlign: 'right', marginBottom: 10 }}><strong>סכום לתשלום:</strong> ₪{order.finalTotal}</div>
          {order.couponCode && (
            <div style={{ textAlign: 'right', marginBottom: 10 }}><strong>קוד קופון:</strong> {order.couponCode}</div>
          )}
          <div style={{ textAlign: 'right', marginBottom: 8, fontWeight: 600 }}>מוצרים שהוזמנו:</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {order.cartItems.map((item: any) => (
              <li key={item.id} style={{ marginBottom: 6, borderBottom: '1px solid #e0e0e0', paddingBottom: 4, fontSize: '1.05em' }}>
                <span style={{ color: '#1a9da1', fontWeight: 700 }}>{item.name}</span> x {item.quantity} <span style={{ color: '#888' }}>- ₪{item.price}</span>
              </li>
            ))}
          </ul>
        </div>
        <button style={{ marginTop: 18, padding: '10px 32px', fontSize: 18, background: '#1a9da1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }} onClick={() => navigate('/')}>חזרה לדף הבית</button>
      </div>
    </div>
  );
};

export default ThankYouPage;
