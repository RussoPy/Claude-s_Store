import React, { useRef, useEffect, useState } from 'react';
import ProductForm from '../components/ProductForm';
import CustomModal from '../components/CustomModal';
import { Product } from '../types/Product';
import { Category } from '../types/Category';
import { db, auth, storage } from '../firebase';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../AdminHome.css';

const EditableField = ({ value, onSave }: { value: string | number, onSave: (newValue: string | number) => void }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);

    const handleSave = () => {
        if (currentValue !== value) {
            onSave(currentValue);
        }
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <input
                type={typeof value === 'number' ? 'number' : 'text'}
                value={currentValue}
                onChange={(e) => setCurrentValue(typeof value === 'number' ? Number(e.target.value) : e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                autoFocus
                style={{ width: '100%' }}
            />
        );
    }

    return (
        <span onClick={() => setIsEditing(true)} style={{ cursor: 'pointer', display: 'inline-block', minWidth: '50px' }}>
            {value}
        </span>
    );
};

const AdminHome: React.FC = () => {
    const productsRef = useRef<HTMLDivElement>(null);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [catLoading, setCatLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingProductId, setUploadingProductId] = useState<string | null>(null);
    const [showTrash, setShowTrash] = useState(false);

    const handleLogout = () => {
        auth.signOut();
    };

    const fetchProducts = () => {
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
                        quantity: data.quantity ?? 0,
                        isAvailable: data.isAvailable !== false,
                        isActive: data.isActive !== false,
                    } as Product;
                });
                const categoriesData: Category[] = categoriesSnap.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                    id: doc.id,
                    ...doc.data(),
                    isActive: doc.data().isActive !== false
                } as Category));

                setAllProducts(productsData);
                setProducts(productsData.filter(p => p.isActive).sort((a, b) => a.name.localeCompare(b.name)));
                setCategories(categoriesData);
                setLoading(false);
                setCatLoading(false);
            })
            .catch(() => {
                setError('שגיאה בטעינת המוצרים או הקטגוריות');
                setLoading(false);
                setCatLoading(false);
            });
    }

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        const activeCategoryIds = new Set(categories.filter(c => c.isActive).map(c => c.id));
        const activeProducts = allProducts.filter(p => p.isActive && activeCategoryIds.has(p.categoryId));

        if (selectedCategory === null) {
            setProducts(activeProducts.sort((a, b) => a.name.localeCompare(b.name)));
        } else {
            setProducts(activeProducts.filter(p => p.categoryId === selectedCategory).sort((a, b) => a.name.localeCompare(b.name)));
        }
    }, [selectedCategory, allProducts, categories]);

    const handleDeleteProduct = async (productId: string) => {
        if (window.confirm('Are you sure you want to hide this product?')) {
            const productRef = doc(db, 'products', productId);
            await updateDoc(productRef, { isActive: false });
            fetchProducts();
        }
    };

    const handleAddProduct = () => {
        setEditingProduct(null);
        setShowModal(true);
    };

    const handleSave = () => {
        fetchProducts();
    };

    const handleAddCategory = async () => {
        const categoryName = prompt("Enter the new category name:");
        if (categoryName) {
            if (categories.some(cat => cat.name.toLowerCase() === categoryName.toLowerCase() && cat.isActive)) {
                alert("An active category with this name already exists.");
                return;
            }
            try {
                await addDoc(collection(db, 'categories'), { name: categoryName, isActive: true });
                fetchProducts();
            } catch (error) {
                console.error("Error adding category: ", error);
                setError("Failed to add category.");
            }
        }
    };

    const handleHideCategory = async (categoryId: string) => {
        const categoryRef = doc(db, 'categories', categoryId);
        await updateDoc(categoryRef, { isActive: false });
        if (selectedCategory === categoryId) {
            setSelectedCategory(null);
        }
        fetchProducts();
    };

    const handleCategoryContextMenu = (e: React.MouseEvent, categoryId: string) => {
        e.preventDefault();
        if (window.confirm(`Are you sure you want to hide this category?`)) {
            handleHideCategory(categoryId);
        }
    };

    const handleRestoreCategory = async (categoryId: string) => {
        const categoryRef = doc(db, 'categories', categoryId);
        await updateDoc(categoryRef, { isActive: true });
        fetchProducts();
    };

    const handleRestoreProduct = async (productId: string) => {
        const productRef = doc(db, 'products', productId);
        await updateDoc(productRef, { isActive: true });
        fetchProducts();
    };

    const handleFieldUpdate = async (productId: string, field: keyof Product, value: string | number | boolean) => {
        try {
            const productRef = doc(db, 'products', productId);
            await updateDoc(productRef, { [field]: value });
            setAllProducts(prev => prev.map(p => p.id === productId ? { ...p, [field]: value } : p));
        } catch (error) {
            console.error("Error updating field: ", error);
            setError("Failed to update product.");
        }
    };

    const handleImageUploadClick = (productId: string) => {
        setUploadingProductId(productId);
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !uploadingProductId) return;

        const storageRef = ref(storage, `products/${uploadingProductId}/${file.name}`);
        try {
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            await handleFieldUpdate(uploadingProductId, 'image', downloadURL);
        } catch (error) {
            console.error("Error uploading image: ", error);
            setError("Failed to upload image.");
        } finally {
            setUploadingProductId(null);
        }
    };

    const activeCategories = categories.filter(c => c.isActive);
    const inactiveCategories = categories.filter(c => !c.isActive);
    const inactiveProducts = allProducts.filter(p => !p.isActive);

    return (
        <>
            <div className="alert alert-info" style={{ borderRadius: 0, textAlign: 'center', position: 'sticky', top: 0, zIndex: 1021, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
                <strong>מצב ניהול</strong> | אתה במצב עריכה.
                <button className="btn btn-sm btn-outline-secondary" onClick={handleLogout}>התנתק</button>
            </div>
            <div className="admin-home-container">
                <div className="product-list-container" ref={productsRef} style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h1>ניהול מוצרים</h1>
                        <div className="admin-actions" style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn btn-info" onClick={() => setShowTrash(true)}>הצג פריטים שנמחקו</button>
                            <button className="btn btn-primary" onClick={handleAddProduct}>הוסף מוצר</button>
                            <button className="btn btn-secondary" onClick={handleAddCategory}>הוסף קטגוריה</button>
                        </div>
                    </div>
                    <div className="category-bar" style={{ display: 'flex', gap: 12, justifyContent: 'center', margin: '24px 0', flexWrap: 'wrap' }}>
                        <button
                            className={`category-btn${selectedCategory === null ? ' selected' : ''}`}
                            style={{ background: selectedCategory === null ? '#1a9da1' : '#fff', color: selectedCategory === null ? '#fff' : '#1a9da1', border: '2px solid #1a9da1', borderRadius: 20, padding: '8px 24px', fontWeight: 700, fontSize: 18, cursor: 'pointer', transition: 'all 0.2s' }}
                            onClick={() => setSelectedCategory(null)}
                        >
                            הכל
                        </button>
                        {!catLoading && activeCategories.map(cat => (
                            <button
                                key={cat.id}
                                className={`category-btn${selectedCategory === cat.id ? ' selected' : ''}`}
                                style={{ background: selectedCategory === cat.id ? '#1a9da1' : '#fff', color: selectedCategory === cat.id ? '#fff' : '#1a9da1', border: '2px solid #1a9da1', borderRadius: 20, padding: '8px 24px', fontWeight: 700, fontSize: 18, cursor: 'pointer', transition: 'all 0.2s' }}
                                onClick={() => setSelectedCategory(cat.id)}
                                onContextMenu={(e) => handleCategoryContextMenu(e, cat.id)}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                    {loading && <p>טוען מוצרים...</p>}
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        accept="image/*"
                    />
                    <div className="admin-product-list">
                        {products.map(product => (
                            <div key={product.id} className="admin-product-row">
                                <div className="product-image-container">
                                    <img src={product.image} alt={product.name} className="product-image-thumb" />
                                    <button className="edit-image-btn" onClick={() => handleImageUploadClick(product.id)}>
                                        ✏️
                                    </button>
                                </div>
                                <div className="product-name">
                                    <EditableField value={product.name} onSave={(newValue) => handleFieldUpdate(product.id, 'name', newValue as string)} />
                                </div>
                                <div className="product-description">
                                    <EditableField value={product.description} onSave={(newValue) => handleFieldUpdate(product.id, 'description', newValue as string)} />
                                </div>
                                <div className="product-availability">
                                    <input
                                        type="checkbox"
                                        checked={product.isAvailable}
                                        onChange={(e) => handleFieldUpdate(product.id, 'isAvailable', e.target.checked)}
                                    />
                                    <label>{product.isAvailable ? 'זמין' : 'אזל מהמלאי'}</label>
                                </div>
                                <div className="product-price">
                                    ₪<EditableField value={product.price} onSave={(newValue) => handleFieldUpdate(product.id, 'price', newValue as number)} />
                                </div>
                                <div className="product-actions">
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteProduct(product.id)}>
                                        מחק
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {showModal && (
                <ProductForm
                    show={showModal}
                    onHide={() => setShowModal(false)}
                    onSave={handleSave}
                    product={editingProduct}
                    categories={activeCategories}
                    allProducts={allProducts}
                />
            )}

            <CustomModal show={showTrash} onHide={() => setShowTrash(false)} title="פריטים שנמחקו">
                <div className="trash-section">
                    <h5>קטגוריות</h5>
                    {inactiveCategories.length === 0 ? <p>אין קטגוריות מחוקות</p> : null}
                    <ul className="list-unstyled">
                        {inactiveCategories.map(cat => (
                            <li key={cat.id} className="d-flex justify-content-between align-items-center mb-2">
                                {cat.name}
                                <button onClick={() => handleRestoreCategory(cat.id)} className="btn btn-sm btn-outline-primary">שחזר</button>
                            </li>
                        ))}
                    </ul>
                </div>
                <hr />
                <div className="trash-section">
                    <h5>מוצרים</h5>
                    {inactiveProducts.length === 0 ? <p>אין מוצרים מחוקים</p> : null}
                    <ul className="list-unstyled">
                        {inactiveProducts.map(prod => (
                            <li key={prod.id} className="d-flex justify-content-between align-items-center mb-2">
                                {prod.name}
                                <button onClick={() => handleRestoreProduct(prod.id)} className="btn btn-sm btn-outline-primary">שחזר</button>
                            </li>
                        ))}
                    </ul>
                </div>
            </CustomModal>
        </>
    );
};

export default AdminHome; 