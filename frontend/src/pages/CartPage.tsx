import React, { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { Product } from '../types/Product';

const CartPage: React.FC = () => {
    const cartContext = useContext(CartContext);

    if (!cartContext) {
        return <div style={{ textAlign: 'center', padding: '50px' }}>טוען...</div>;
    }

    const { cartItems, addToCart, decrementFromCart, removeFromCart, getCartTotal } = cartContext;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: "'Heebo', sans-serif" }}>
            <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>העגלה שלך</h1>

            {cartItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                    <p style={{ fontSize: '1.2em', marginBottom: '30px' }}>העגלה ריקה.</p>
                    <Link to="/">
                        <button style={{ padding: '15px 30px', fontSize: '1.1em', cursor: 'pointer', backgroundColor: '#1a9da1', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 600 }}>
                            חזור לחנות והמשך לקנות
                        </button>
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', alignItems: 'start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {cartItems.map(item => (
                            <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '100px 1fr auto', gap: '20px', alignItems: 'center', background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                                <img src={item.image} alt={item.name} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '6px' }} />
                                <div>
                                    <h3 style={{ margin: '0 0 10px', fontSize: '18px' }}>{item.name}</h3>
                                    <p style={{ margin: '5px 0', color: '#666' }}>₪{item.price.toFixed(2)}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0' }}>
                                        <button style={{ width: '32px', height: '32px', padding: 0, fontSize: '1.2em', lineHeight: 1, cursor: 'pointer', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#f0f0f0', color: '#333' }} onClick={() => decrementFromCart(item.id)}>-</button>
                                        <span style={{ minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                                        <button style={{ width: '32px', height: '32px', padding: 0, fontSize: '1.2em', lineHeight: 1, cursor: 'pointer', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#f0f0f0', color: '#333' }} onClick={() => addToCart(item)}>+</button>
                                    </div>
                                    <p style={{ fontWeight: 'bold', fontSize: '1.1em', margin: '10px 0 0' }}>סה"כ: ₪{(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                                <button style={{ background: 'none', border: 'none', color: '#f44336', fontWeight: 'bold', cursor: 'pointer', padding: '8px', fontSize: '1em', alignSelf: 'flex-start' }} onClick={() => removeFromCart(item.id)}>הסר</button>
                            </div>
                        ))}
                    </div>

                    <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', position: 'sticky', top: '40px' }}>
                        <h2 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>סיכום הזמנה</h2>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2em', fontWeight: 'bold', marginBottom: '25px' }}>
                            <span>סה"כ:</span>
                            <span>₪{getCartTotal().toFixed(2)}</span>
                        </div>
                        <Link to="/checkout" style={{ textDecoration: 'none' }}>
                            <button style={{ width: '100%', padding: '15px', fontSize: '1.1em', cursor: 'pointer', backgroundColor: '#1a9da1', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 600 }}>המשך לתשלום</button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;