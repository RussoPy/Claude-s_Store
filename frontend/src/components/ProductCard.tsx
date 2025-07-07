import React, { useContext } from 'react';
import { Product } from '../types/Product';
import { CartContext } from '../context/CartContext';

interface ProductCardProps {
    product: Product;
    onProductAdd?: () => void;
    onProductRemove?: () => void;
    isAdmin?: boolean;
    disabled?: boolean;
    label?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onProductAdd, onProductRemove, isAdmin = false, disabled = false, label }) => {
    const cartContext = useContext(CartContext);

    if (!cartContext) {
        return null;
    }

    const { cartItems, addToCart, decrementFromCart } = cartContext;
    const itemInCart = cartItems.find(item => item.id === product.id);

    const handleAddToCart = () => {
        addToCart(product);
        if (onProductAdd) onProductAdd();
    };

    const handleRemoveFromCart = () => {
        decrementFromCart(product.id);
        if (onProductRemove) onProductRemove();
    };

    return (
        <div className="product-card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: disabled ? 0.6 : 1 }}>
            {product.isOnSale && product.salePercentage && (
                <div className="sale-badge" style={{ position: 'absolute', top: '20px', left: '20px', background: 'red', color: 'white', padding: '5px 10px', borderRadius: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                    {product.salePercentage}% הנחה!
                </div>
            )}
            <div style={{ width: '100%', aspectRatio: '3/2', background: 'transparent', borderRadius: '18px', overflow: 'hidden', marginTop: 15, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={product.image || ''} alt={product.name} style={{ width: '90%', height: '90%', objectFit: 'cover', borderRadius: '18px', background: 'transparent' }} />
            </div>
            <h3>{product.name}</h3>
            {product.isOnSale && product.salePercentage ? (
                <div className="price-container" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 2px 0' }}>
                    <span style={{ textDecoration: 'line-through', color: '#888', fontSize: '1em', fontWeight: 400, background: '#f8d7da', borderRadius: 6, padding: '2px 8px', marginBottom: 0 }}>
                        ₪{product.price.toFixed(2)}
                    </span>
                    <span style={{ fontWeight: 700, color: '#fff', background: 'linear-gradient(90deg, #1a9da1 0%, #0e5a5e 100%)', borderRadius: 8, padding: '4px 16px', fontSize: '1.18em', boxShadow: '0 2px 8px rgba(26,157,161,0.08)', marginBottom: 0, letterSpacing: 1 }}>
                        ₪{(product.price * (1 - product.salePercentage / 100)).toFixed(2)}
                    </span>
                </div>
            ) : (
                <span style={{ fontWeight: 700, color: '#fff', background: 'linear-gradient(90deg, #1a9da1 0%, #0e5a5e 100%)', borderRadius: 8, padding: '4px 16px', fontSize: '1.18em', boxShadow: '0 2px 8px rgba(26,157,161,0.08)', marginBottom: 0, letterSpacing: 1, display: 'inline-block', margin: '0 0 2px 0' }}>
                    ₪{product.price.toFixed(2)}
                </span>
            )}
            {product.description && (
                <p style={{ color: '#555', fontSize: '1em', margin: '2px 0 6px 0', textAlign: 'center', minHeight: 24 }}>
                    {product.description}
                </p>
            )}
            <div style={{ height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {label && <p style={{ color: 'red', fontWeight: 'bold', margin: 0 }}>{label}</p>}
            </div>

            {!isAdmin && (
                itemInCart ? (
                    <div className="quantity-control" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button className="quantity-btn" style={{ fontSize: '0.9em', width: 28, height: 28, minWidth: 0, padding: 0 }} onClick={handleRemoveFromCart} disabled={disabled} aria-label={`הפחת כמות של ${product.name}`}>-</button>
                        <span style={{ minWidth: 24, textAlign: 'center', display: 'inline-block' }} aria-live="polite">{itemInCart.quantity}</span>
                        <button className="quantity-btn" style={{ fontSize: '0.9em', width: 28, height: 28, minWidth: 0, padding: 0 }} onClick={() => { addToCart(product); if (onProductAdd) onProductAdd(); }} disabled={disabled} aria-label={`הוסף עוד ${product.name}`}>+</button>
                    </div>
                ) : (
                    <button onClick={handleAddToCart} disabled={disabled}>הוסף לעגלה</button>
                )
            )}
        </div>
    );
};

export default ProductCard;