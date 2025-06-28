import React, { useRef, useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import { Product } from '../types/Product';
import { Category } from '../types/Category';
import { db } from '../firebase';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import 'bootstrap/dist/css/bootstrap.min.css';

interface CustomerHomeProps {
    onProductAdd?: () => void;
    onProductRemove?: () => void;
}

const CustomerHome: React.FC<CustomerHomeProps> = ({ onProductAdd, onProductRemove }) => {
    const productsRef = useRef<HTMLDivElement>(null);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [catLoading, setCatLoading] = useState(true);
    const heroImages = [
        '/front-pic1.jpg',
        '/front-pic2.jpg'
    ];

    useEffect(() => {
        setLoading(true);
        setCatLoading(true);
        Promise.all([
            getDocs(collection(db, 'products')),
            getDocs(collection(db, 'categories'))
        ])
            .then(([productsSnap, categoriesSnap]) => {
                const productsData: Product[] = productsSnap.docs
                    .map((doc: QueryDocumentSnapshot<DocumentData>) => {
                        const data = doc.data();
                        let categoryId = '';
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
                            isAvailable: data.isAvailable !== false,
                            isActive: data.isActive !== false,
                        } as Product;
                    });

                const categoriesData: Category[] = categoriesSnap.docs
                    .map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                        id: doc.id,
                        ...doc.data(),
                        isActive: doc.data().isActive !== false
                    } as Category));

                const activeCategories = categoriesData.filter(c => c.isActive);
                const activeCategoryIds = new Set(activeCategories.map(c => c.id));
                const activeProducts = productsData.filter(p => p.isActive && activeCategoryIds.has(p.categoryId));

                setAllProducts(activeProducts);
                setProducts(activeProducts);
                setCategories(activeCategories);
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
            <div className="hero" style={{ position: 'relative', minHeight: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'linear-gradient(90deg, #e0f7fa 0%, #b2ebf2 100%)' }}>
                <div id="heroCarousel" className="carousel slide" data-bs-ride="carousel" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 430, zIndex: 1 }}>
                    <div className="carousel-indicators">
                        {heroImages.map((_, idx) => (
                            <button
                                key={idx}
                                type="button"
                                data-bs-target="#heroCarousel"
                                data-bs-slide-to={idx}
                                className={idx === 0 ? 'active' : ''}
                                aria-current={idx === 0 ? 'true' : undefined}
                                aria-label={`Slide ${idx + 1}`}
                            ></button>
                        ))}
                    </div>
                    <div className="carousel-inner" style={{ width: '100%', height: '100%' }}>
                        {heroImages.map((img, idx) => (
                            <div className={`carousel-item${idx === 0 ? ' active' : ''}`} key={img} style={{ width: '100%', height: '100%' }}>
                                <img src={img} className="d-block w-100" alt={`hero-${idx}`} style={{ height: 450, objectFit: 'cover', opacity: 0.85 }} />
                            </div>
                        ))}
                    </div>
                    <button className="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
                        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                        <span className="visually-hidden">Previous</span>
                    </button>
                    <button className="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
                        <span className="carousel-control-next-icon" aria-hidden="true"></span>
                        <span className="visually-hidden">Next</span>
                    </button>
                </div>
                <div style={{
                    position: 'relative',
                    zIndex: 2,
                    color: '#333',
                    textAlign: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    padding: '20px 40px',
                    borderRadius: '50px',
                    maxWidth: '80%'
                }}>
                    <h1>מסורת ישנה, מרכיבים טריים.</h1>
                    <button onClick={handleScrollToProducts}>התפריט שלנו</button>
                </div>
            </div>
            <div className="product-list-container" ref={productsRef}>
                <h1 className="menu-title">התפריט שלנו</h1>
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
                        <ProductCard
                            key={product.id}
                            product={product}
                            onProductAdd={product.isAvailable ? onProductAdd : undefined}
                            onProductRemove={onProductRemove}
                            disabled={!product.isAvailable}
                            label={!product.isAvailable ? 'אזל מהמלאי' : undefined}
                        />
                    ))}
                </div>
            </div>
        </>
    );
};

export default CustomerHome; 