import React, { useRef, useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import { Product } from '../types/Product';
import { Category } from '../types/Category';

interface HomePageProps {
    onProductAdd?: () => void;
    onProductRemove?: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onProductAdd, onProductRemove }) => {
    const productsRef = useRef<HTMLDivElement>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [catLoading, setCatLoading] = useState(true);

    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    useEffect(() => {
        setLoading(true);
        let url = `${backendUrl}/api/products/`;
        if (selectedCategory) {
            url += `?category_id=${selectedCategory}`;
        }
        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error('Network response was not ok');
                return res.json();
            })
            .then(data => {
                setProducts(data);
                setLoading(false);
            })
            .catch(err => {
                setError('שגיאה בטעינת המוצרים');
                setLoading(false);
            });
    }, [selectedCategory]);

    useEffect(() => {
        setCatLoading(true);
        fetch(`${backendUrl}/api/categories/`)
            .then(res => {
                if (!res.ok) throw new Error('Network response was not ok');
                return res.json();
            })
            .then(data => {
                setCategories(data);
                setCatLoading(false);
            })
            .catch(() => setCatLoading(false));
    }, []);

    const handleScrollToProducts = () => {
        if (productsRef.current) {
            productsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <>
            <div className="hero">
                <h1>מסורת ישנה, מרכיבים טריים.</h1>
                <p>מקאפקייקס ועד חטיפי ילדים, יש לנו הכל בשבילכם.</p>
                <button onClick={handleScrollToProducts}>קנה ללא צבעי מאכל</button>
            </div>
            <div className="product-list-container" ref={productsRef}>
                <h1>התפריט שלנו</h1>
                <div className="category-bar" style={{ display: 'flex', gap: 12, justifyContent: 'center', margin: '24px 0' }}>
                    <button
                        className={`category-btn${selectedCategory === null ? ' selected' : ''}`}
                        style={{ background: selectedCategory === null ? '#1a9da1' : '#fff', color: selectedCategory === null ? '#fff' : '#1a9da1', border: '2px solid #1a9da1', borderRadius: 20, padding: '8px 24px', fontWeight: 700, fontSize: 18, cursor: 'pointer', transition: 'all 0.2s' }}
                        onClick={() => setSelectedCategory(null)}
                    >
                        הכל
                    </button>
                    {!catLoading && categories.map(cat => (
                        <button
                            key={cat.id}
                            className={`category-btn${selectedCategory === cat.id ? ' selected' : ''}`}
                            style={{ background: selectedCategory === cat.id ? '#1a9da1' : '#fff', color: selectedCategory === cat.id ? '#fff' : '#1a9da1', border: '2px solid #1a9da1', borderRadius: 20, padding: '8px 24px', fontWeight: 700, fontSize: 18, cursor: 'pointer', transition: 'all 0.2s' }}
                            onClick={() => setSelectedCategory(cat.id)}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
                {loading && <p>טוען מוצרים...</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <div className="product-list">
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} onProductAdd={onProductAdd} onProductRemove={onProductRemove} />
                    ))}
                </div>
            </div>
        </>
    );
};

export default HomePage;