import React, { useState } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import './AccessibilityMenu.css';

export const AccessibilityMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { settings, increaseFontSize, decreaseFontSize, resetFontSize, toggleHighContrast, toggleUnderlineLinks } = useAccessibility();

    return (
        <div className={`accessibility-menu ${isOpen ? 'open' : ''}`}>
            <button className="menu-toggle-button" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen} aria-controls="accessibility-controls">
                ♿
            </button>
            <div className="accessibility-controls" id="accessibility-controls" hidden={!isOpen}>
                <h3>אפשרויות נגישות</h3>
                <div className="control-group">
                    <h4>גודל טקסט</h4>
                    <div className="text-size-controls">
                        <button onClick={decreaseFontSize}>א-</button>
                        <button onClick={resetFontSize}>איפוס</button>
                        <button onClick={increaseFontSize}>א+</button>
                    </div>
                </div>
                <div className="control-group">
                    <h4>תצוגה</h4>
                    <label>
                        <input type="checkbox" checked={settings.highContrast} onChange={toggleHighContrast} />
                        ניגודיות גבוהה
                    </label>
                </div>
                <div className="control-group">
                    <label>
                        <input type="checkbox" checked={settings.underlineLinks} onChange={toggleUnderlineLinks} />
                        הדגשת קישורים
                    </label>
                </div>
            </div>
        </div>
    );
}; 