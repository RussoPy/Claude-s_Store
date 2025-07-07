import React, { createContext, useState, useContext, ReactNode } from 'react';

type AccessibilityState = {
    fontSizeMultiplier: number;
    highContrast: boolean;
    underlineLinks: boolean;
};

type AccessibilityContextType = {
    settings: AccessibilityState;
    increaseFontSize: () => void;
    decreaseFontSize: () => void;
    resetFontSize: () => void;
    toggleHighContrast: () => void;
    toggleUnderlineLinks: () => void;
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider = ({ children }: { children: ReactNode }) => {
    const [settings, setSettings] = useState<AccessibilityState>({
        fontSizeMultiplier: 1,
        highContrast: false,
        underlineLinks: false,
    });

    const increaseFontSize = () => {
        setSettings(s => ({ ...s, fontSizeMultiplier: Math.min(s.fontSizeMultiplier + 0.1, 1.5) }));
    };

    const decreaseFontSize = () => {
        setSettings(s => ({ ...s, fontSizeMultiplier: Math.max(s.fontSizeMultiplier - 0.1, 0.8) }));
    };

    const resetFontSize = () => {
        setSettings(s => ({ ...s, fontSizeMultiplier: 1 }));
    };

    const toggleHighContrast = () => {
        setSettings(s => ({ ...s, highContrast: !s.highContrast }));
    };

    const toggleUnderlineLinks = () => {
        setSettings(s => ({ ...s, underlineLinks: !s.underlineLinks }));
    };

    return (
        <AccessibilityContext.Provider value={{ settings, increaseFontSize, decreaseFontSize, resetFontSize, toggleHighContrast, toggleUnderlineLinks }}>
            {children}
        </AccessibilityContext.Provider>
    );
};

export const useAccessibility = () => {
    const context = useContext(AccessibilityContext);
    if (context === undefined) {
        throw new Error('useAccessibility must be used within an AccessibilityProvider');
    }
    return context;
}; 