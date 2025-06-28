import React from 'react';
import './CustomModal.css';

interface CustomModalProps {
    show: boolean;
    onHide: () => void;
    title: string;
    children: React.ReactNode;
}

const CustomModal: React.FC<CustomModalProps> = ({ show, onHide, title, children }) => {
    if (!show) {
        return null;
    }

    return (
        <div className="modal-backdrop" onClick={onHide}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h5 className="modal-title">{title}</h5>
                    <button type="button" className="btn-close" onClick={onHide}></button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default CustomModal; 