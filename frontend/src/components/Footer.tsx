import React from 'react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer-main">
            <div className="footer-content">
                <div className="footer-section">
                    <h3>המעדניה של קלוד בע"מ</h3>
                    <p> מסורת של איכות, טריות ושירות מכל הלב.</p>
                </div>
                <div className="footer-section">
                    <h4>המפה שלנו</h4>
                    <div className="footer-map">
                        <iframe
                            title="מפה - המעדניה של קלוד"
                            src="https://www.google.com/maps?q=רח'+הכרמל+5,+תל+אביב&output=embed"
                            width="100%"
                            height="180"
                            style={{ border: 0, borderRadius: '12px', marginTop: '8px' }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                    </div>
                </div>
                <div className="footer-section">
                    <h4>צור קשר</h4>
                    <p>טלפון: <a href="tel:+9720505675681">050-5675681</a></p>
                    <p>דוא"ל: <a href="mailto:shmalze.123@gmail.com" rel="noopener noreferrer">shmalze.123@gmail.com</a></p>
                    <p>כתובת: <a href="https://maps.google.com/?q=רח' הכרמל 5, תל אביב" target="_blank" rel="noopener noreferrer">רח' הכרמל 5, תל אביב</a></p>
                </div>
            </div>
            <div className="footer-bottom">
                <button onClick={() => window.location.href = '/terms'} style={{ background: '#1a9da1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 24px', fontWeight: 600, cursor: 'pointer', marginBottom: 12 }}>
                    תקנון האתר
                </button>
                <p>© {new Date().getFullYear()} המעדיה של קלוד — כל הזכויות שמורות.</p>
            </div>
        </footer>
    );
};

export default Footer;