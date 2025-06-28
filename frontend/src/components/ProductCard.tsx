import React, { useContext } from 'react';
import { Product } from '../types/Product';
import { CartContext } from '../context/CartContext';

interface ProductCardProps {
    product: Product;
    onProductAdd?: () => void;
    onProductRemove?: () => void;
    isAdmin?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onProductAdd, onProductRemove, isAdmin = false }) => {
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
        <div className="product-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', aspectRatio: '3/2', background: 'transparent', borderRadius: '18px', overflow: 'hidden', marginTop: 15, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={product.image || ''} alt={product.name} style={{ width: '90%', height: '90%', objectFit: 'cover', borderRadius: '18px', background: 'transparent' }} />
            </div>
            <h3>{product.name}</h3>
            <p>₪{product.price.toFixed(2)}</p>
            {!isAdmin && (
                itemInCart ? (
                    <div className="quantity-control" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button className="quantity-btn" style={{ fontSize: '0.9em', width: 28, height: 28, minWidth: 0, padding: 0 }} onClick={handleRemoveFromCart}>-</button>
                        <span style={{ minWidth: 24, textAlign: 'center', display: 'inline-block' }}>{itemInCart.quantity}</span>
                        <button className="quantity-btn" style={{ fontSize: '0.9em', width: 28, height: 28, minWidth: 0, padding: 0 }} onClick={() => { addToCart(product); if (onProductAdd) onProductAdd(); }}>+</button>
                    </div>
                ) : (
                    <button onClick={handleAddToCart}>הוסף לעגלה</button>
                )
            )}
        </div>
    );
};

export default ProductCard;