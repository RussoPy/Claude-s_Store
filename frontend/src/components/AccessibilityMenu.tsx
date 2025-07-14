import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useAccessibility } from '../context/AccessibilityContext';
import './AccessibilityMenu.css';

export const AccessibilityMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const {
        settings,
        increaseFontSize,
        decreaseFontSize,
        resetFontSize,
        toggleHighContrast,
        toggleUnderlineLinks,
        toggleGrayscale,
        toggleReadableFont,
        toggleInvertColors,
        toggleHighlightHeadings,
        resetAll
    } = useAccessibility();

    const menuContent = (
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
                    <label>
                        <input type="checkbox" checked={settings.invertColors} onChange={toggleInvertColors} />
                        היפוך צבעים
                    </label>
                    <label>
                        <input type="checkbox" checked={settings.grayscale} onChange={toggleGrayscale} />
                        גווני אפור
                    </label>
                </div>
                <div className="control-group">
                    <h4>תוכן</h4>
                    <label>
                        <input type="checkbox" checked={settings.underlineLinks} onChange={toggleUnderlineLinks} />
                        הדגשת קישורים
                    </label>
                    <label>
                        <input type="checkbox" checked={settings.highlightHeadings} onChange={toggleHighlightHeadings} />
                        הדגשת כותרות
                    </label>
                    <label>
                        <input type="checkbox" checked={settings.readableFont} onChange={toggleReadableFont} />
                        גופן קריא
                    </label>
                </div>
                <div className="control-group">
                    <button onClick={resetAll} className="reset-all-button">איפוס כל ההגדרות</button>
                </div>
            </div>
        </div>
    );

    const portalRoot = document.getElementById('accessibility-menu-root');
    return portalRoot ? ReactDOM.createPortal(menuContent, portalRoot) : null;
}; 