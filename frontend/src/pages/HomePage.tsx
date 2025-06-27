import React, { useRef, useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import { Product } from '../types/Product';
import { Category } from '../types/Category';
import { db } from '../firebase';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

interface HomePageProps {
    onProductAdd?: () => void;
    onProductRemove?: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onProductAdd, onProductRemove }) => {
    const productsRef = useRef<HTMLDivElement>(null);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [catLoading, setCatLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        setCatLoading(true);
        Promise.all([
            getDocs(collection(db, 'products')),
            getDocs(collection(db, 'categories'))
        ])
        .then(([productsSnap, categoriesSnap]) => {
            const productsData: Product[] = productsSnap.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
                const data = doc.data();
                let categoryId = '';
                // Handle Firestore DocumentReference or string
                if (data.categoryRef && typeof data.categoryRef === 'object' && 'id' in data.categoryRef) {
                    categoryId = data.categoryRef.id;
                } else if (typeof data.categoryRef === 'string') {
                    const parts = data.categoryRef.split('/');
                    categoryId = parts[parts.length - 1];
                }
                return {
                    id: doc.id,
                    name: data.name,
                    description: data.description,
                    price: data.price,
                    image: data.image || data.imageUrl || '',
                    categoryId,
                } as Product;
            });
            const categoriesData: Category[] = categoriesSnap.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() } as Category));
            setAllProducts(productsData);
            setProducts(productsData);
            setCategories(categoriesData);
            setLoading(false);
            setCatLoading(false);
        })
        .catch(() => {
            setError('שגיאה בטעינת המוצרים או הקטגוריות');
            setLoading(false);
            setCatLoading(false);
        });
    }, []);

    useEffect(() => {
        if (selectedCategory === null) {
            setProducts(allProducts);
        } else {
            setProducts(allProducts.filter(p => p.categoryId === selectedCategory));
        }
    }, [selectedCategory, allProducts]);

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