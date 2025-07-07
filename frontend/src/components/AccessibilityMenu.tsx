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
                <h3>Accessibility Options</h3>
                <div className="control-group">
                    <h4>Text Size</h4>
                    <div className="text-size-controls">
                        <button onClick={decreaseFontSize}>A-</button>
                        <button onClick={resetFontSize}>Reset</button>
                        <button onClick={increaseFontSize}>A+</button>
                    </div>
                </div>
                <div className="control-group">
                    <h4>Display</h4>
                    <label>
                        <input type="checkbox" checked={settings.highContrast} onChange={toggleHighContrast} />
                        High Contrast
                    </label>
                </div>
                <div className="control-group">
                    <label>
                        <input type="checkbox" checked={settings.underlineLinks} onChange={toggleUnderlineLinks} />
                        Underline Links
                    </label>
                </div>
            </div>
        </div>
    );
}; 