import React from 'react';
import ProductCard from '../components/ProductCard';
import { products } from '../data/products';

const HomePage = () => {
    return (
        <>
            <div className="hero">
                <h1>Old traditions, fresh ingredients.</h1>
                <p>From cake pops to kids' snack-tivities, we've got you covered.</p>
                <button>Shop dye-free</button>
            </div>
            <div className="product-list-container">
                <h1>Our Menu</h1>
                <div className="product-list">
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </>
    );
};

export default HomePage; 