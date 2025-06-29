import React, { useState, useEffect } from 'react';
import { Product } from '../types/Product';
import './CustomModal.css'; // Using existing modal styles

interface SaleModalProps {
    product: Product | null;
    onClose: () => void;
    onSave: (productId: string, salePercentage: number | null) => void;
}

const SaleModal: React.FC<SaleModalProps> = ({ product, onClose, onSave }) => {
    const [percentage, setPercentage] = useState(0);

    useEffect(() => {
        if (product?.isOnSale && product.salePercentage) {
            setPercentage(product.salePercentage);
        } else {
            setPercentage(0);
        }
    }, [product]);

    if (!product) {
        return null;
    }

    const originalPrice = product.price;
    const salePrice = originalPrice - (originalPrice * (percentage / 100));

    const handleSave = () => {
        onSave(product.id, percentage);
        onClose();
    };

    const handleRemoveSale = () => {
        onSave(product.id, null); // Passing null to indicate sale removal
        onClose();
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>הנחה על {product.name}</h2>
                <div className="form-group">
                    <label htmlFor="sale-percentage">אחוז הנחה (%)</label>
                    <input
                        type="number"
                        id="sale-percentage"
                        className="form-control"
                        value={percentage}
                        onChange={(e) => setPercentage(Number(e.target.value))}
                        min="0"
                        max="100"
                    />
                </div>
                <div>
                    <p>מחיר לפני הנחה: ₪{originalPrice.toFixed(2)}</p>
                    <p>
                        <strong>מחיר אחרי הנחה: ₪{salePrice.toFixed(2)}</strong>
                    </p>
                </div>
                <div className="modal-actions">
                    <button className="btn btn-primary" onClick={handleSave}>שמור</button>
                    {product.isOnSale && (
                        <button className="btn btn-danger" onClick={handleRemoveSale}>הסר הנחה</button>
                    )}
                    <button className="btn btn-secondary" onClick={onClose}>בטל</button>
                </div>
            </div>
        </div>
    );
};

export default SaleModal; 