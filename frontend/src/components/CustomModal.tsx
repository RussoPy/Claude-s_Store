import React, { useEffect } from 'react';
import ReactModal from 'react-modal';
import './CustomModal.css';

interface CustomModalProps {
    show: boolean;
    onHide: () => void;
    title: string;
    children: React.ReactNode;
}

// Bind modal to your appElement
if (process.env.NODE_ENV !== 'test') {
    ReactModal.setAppElement('#root');
}


const CustomModal: React.FC<CustomModalProps> = ({ show, onHide, title, children }) => {
    return (
        <ReactModal
            isOpen={show}
            onRequestClose={onHide}
            className="modal-content"
            overlayClassName="modal-backdrop"
            contentLabel={title} // This is important for accessibility
        >
            <div className="modal-header">
                <h5 className="modal-title" id="modal-title-id">{title}</h5>
                <button type="button" className="btn-close" onClick={onHide} aria-label="Close"></button>
            </div>
            <div className="modal-body">
                {children}
            </div>
        </ReactModal>
    );
};

export default CustomModal; 