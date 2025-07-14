import React from 'react';
import { Link } from 'react-router-dom';
import './ContactPage.css';

const ContactPage = () => {
    return (
        <div className="contact-page-container">
            <h1>צור קשר</h1>
            <p>אנחנו כאן לכל שאלה, בקשה או הצעה. הרגישו חופשי ליצור איתנו קשר בכל אחת מהדרכים הבאות:</p>

            <div className="contact-details">
                <div className="contact-card">
                    <h2><i className="fas fa-phone"></i> טלפון</h2>
                    <p>נשמח לעמוד לשירותכם בטלפון:</p>
                    <p><a href="tel:050-5675681">050-5675681</a></p>
                    <p>שעות פעילות המענה הטלפוני: ימים א'-ה' 09:00-18:00</p>
                </div>

                <div className="contact-card">
                    <h2><i className="fas fa-envelope"></i> דואר אלקטרוני</h2>
                    <p>ניתן לשלוח לנו מייל לכתובת:</p>
                    <p><a href="mailto:shmalze.123@gmail.com">Contact@claude-deli.com</a></p>
                    <p>אנו משתדלים לענות לכל הפניות תוך 24 שעות.</p>
                </div>

                <div className="contact-card">
                    <h2><i className="fas fa-map-marker-alt"></i> כתובתנו</h2>
                    <p>המעדנייה ממוקמת ב:</p>
                    <p><a href="https://maps.google.com/?q=רח' הכרמל 5, תל אביב" target="_blank" rel="noopener noreferrer">רח' הכרמל 5, תל אביב</a></p>
                    <p>בואו לבקר ולהתרשם ממגוון המוצרים!</p>
                </div>
            </div>

            <div className="contact-links">
                <p>קישורים מהירים שעשויים לעניין אותך:</p>
                <ul>
                    <li><Link to="/terms">תקנון האתר</Link></li>
                    <li><Link to="/privacy">מדיניות פרטיות</Link></li>
                    <li><Link to="/accessibility-statement">הצהרת נגישות</Link></li>
                </ul>
            </div>
        </div>
    );
};

export default ContactPage; 