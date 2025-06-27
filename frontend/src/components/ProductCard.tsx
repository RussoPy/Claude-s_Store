import React, { useContext } from 'react';
import { Product } from '../types/Product';
import { CartContext } from '../context/CartContext';

interface ProductCardProps {
    product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const cartContext = useContext(CartContext);

    if (!cartContext) {
        return null;
    }

    const { cartItems, addToCart, decrementFromCart } = cartContext;
    const itemInCart = cartItems.find(item => item.id === product.id);

    return (
        <div className="product-card">
            <img src={product.image} alt={product.name} />
            <h3>{product.name}</h3>
            <p>${product.price.toFixed(2)}</p>
            {itemInCart ? (
                <div className="quantity-control">
                    <button onClick={() => decrementFromCart(product.id)}>-</button>
                    <span>{itemInCart.quantity}</span>
                    <button onClick={() => addToCart(product)}>+</button>
                </div>
            ) : (
                <button onClick={() => addToCart(product)}>Add to Cart</button>
            )}
        </div>
    );
};

export default ProductCard; 