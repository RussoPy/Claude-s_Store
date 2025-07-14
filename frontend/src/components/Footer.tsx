import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer-main">
            <div className="footer-content">
                <div className="footer-section">
                    <h3>המעדניה של קלוד</h3>
                    <p style={{ margin: 0, color: '#fff', fontWeight: 600 }}>זמן הכנת משלוח: 3-4 ימים</p>
                    <p> מסורת של איכות, טריות ושירות מכל הלב.</p>
                </div>
                <div className="footer-section">
                    <h4>קישורים שימושיים</h4>
                    <ul className="footer-links">
                        <li><Link to="/terms">תקנון האתר</Link></li>
                        <li><Link to="/privacy">מדיניות פרטיות</Link></li>
                        <li><Link to="/accessibility-statement">הצהרת נגישות</Link></li>
                        <li><Link to="/contact">צור קשר</Link></li>
                    </ul>
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
                    <h4><Link to="/contact" style={{ color: 'inherit', textDecoration: 'none', font: 'inherit' }}>צור קשר</Link></h4>
                    <p>טלפון: <a href="tel:+9720505675681">050-5675681</a></p>
                    <p>דוא"ל: <a href="mailto:shmalze.123@gmail.com" rel="noopener noreferrer">contact@claude-deli.com</a></p>
                    <p>כתובת: <a href="https://maps.google.com/?q=רח' הכרמל 5, תל אביב" target="_blank" rel="noopener noreferrer">רח' הכרמל 5, תל אביב</a></p>
                </div>
            </div>
            <div className="footer-bottom">
                <p>© {new Date().getFullYear()} המעדיה של קלוד — כל הזכויות שמורות.</p>
            </div>
        </footer>
    );
};

export default Footer;