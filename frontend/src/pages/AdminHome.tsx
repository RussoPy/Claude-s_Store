import React, { useRef, useEffect, useState } from 'react';
import CustomModal from '../components/CustomModal';
import SaleModal from '../components/SaleModal';
import CouponModal from '../components/CouponModal';
import { Product } from '../types/Product';
import { Category } from '../types/Category';
import { db, auth, storage } from '../firebase';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../AdminHome.css';
import ProductForm from '../components/ProductForm';
import OrdersView from './OrdersView';

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
    const [showSaleModal, setShowSaleModal] = useState(false);
    const [saleProduct, setSaleProduct] = useState<Product | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingProductId, setUploadingProductId] = useState<string | null>(null);
    const [showTrash, setShowTrash] = useState(false);
    const [showCouponModal, setShowCouponModal] = useState(false);
    const [currentView, setCurrentView] = useState<'products' | 'orders'>('products');

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
                        isOnSale: data.isOnSale,
                        salePercentage: data.salePercentage,
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
        if (currentView === 'products') {
            fetchProducts();
        }
    }, [currentView]);

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
        setShowModal(false);
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

    const handleOpenSaleModal = (product: Product) => {
        setSaleProduct(product);
        setShowSaleModal(true);
    };

    const handleCloseSaleModal = () => {
        setSaleProduct(null);
        setShowSaleModal(false);
    };

    const handleSaveSale = async (productId: string, salePercentage: number | null) => {
        try {
            const productRef = doc(db, 'products', productId);
            if (salePercentage === null || salePercentage <= 0) {
                await updateDoc(productRef, {
                    isOnSale: false,
                    salePercentage: null
                });
            } else {
                await updateDoc(productRef, {
                    isOnSale: true,
                    salePercentage: salePercentage
                });
            }
            fetchProducts();
        } catch (error) {
            console.error("Error updating sale: ", error);
            setError("Failed to update sale.");
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
                <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h1>דשבורד ניהול</h1>
                        <div className="admin-actions" style={{ display: 'flex', gap: '10px' }}>
                            <button className={`btn ${currentView === 'products' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setCurrentView('products')}>ניהול מוצרים</button>
                            <button className={`btn ${currentView === 'orders' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setCurrentView('orders')}>ניהול הזמנות</button>
                        </div>
                    </div>

                    {currentView === 'products' && (
                        <div className="product-list-container" ref={productsRef}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2>מוצרים</h2>
                                <div className="admin-actions" style={{ display: 'flex', gap: '10px' }}>
                                    <button className="btn btn-info" onClick={() => setShowTrash(true)}>הצג פריטים שנמחקו</button>
                                    <button className="btn btn-success" onClick={() => setShowCouponModal(true)}>נהל קופונים</button>
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
                                        onContextMenu={(e) => handleCategoryContextMenu(e, cat.id)}
                                        style={{ background: selectedCategory === cat.id ? '#1a9da1' : '#fff', color: selectedCategory === cat.id ? '#fff' : '#1a9da1', border: '2px solid #1a9da1', borderRadius: 20, padding: '8px 24px', fontWeight: 700, fontSize: 18, cursor: 'pointer', transition: 'all 0.2s' }}
                                        onClick={() => setSelectedCategory(cat.id)}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>

                            <div className="table-responsive">
                                <table className="table table-striped table-hover">
                                    <thead>
                                        <tr>
                                            <th>תמונה</th>
                                            <th>שם</th>
                                            <th>תיאור</th>
                                            <th>מחיר</th>
                                            <th>זמינות</th>
                                            <th>מבצע</th>
                                            <th>פעולות</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map((p) => (
                                            <tr key={p.id}>
                                                <td>
                                                    <img
                                                        src={p.image || "https://via.placeholder.com/60"}
                                                        alt={p.name}
                                                        style={{ width: '60px', height: '60px', cursor: 'pointer', objectFit: 'cover', borderRadius: '4px' }}
                                                        onClick={() => handleImageUploadClick(p.id)}
                                                    />
                                                </td>
                                                <td><EditableField value={p.name} onSave={(val) => handleFieldUpdate(p.id, 'name', val as string)} /></td>
                                                <td><EditableField value={p.description} onSave={(val) => handleFieldUpdate(p.id, 'description', val as string)} /></td>
                                                <td><EditableField value={p.price} onSave={(val) => handleFieldUpdate(p.id, 'price', val as number)} /></td>
                                                <td>
                                                    <div className="form-check form-switch d-flex justify-content-center">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            role="switch"
                                                            checked={p.isAvailable}
                                                            onChange={(e) => handleFieldUpdate(p.id, 'isAvailable', e.target.checked)}
                                                        />
                                                    </div>
                                                </td>
                                                <td>
                                                    {p.isOnSale ? (
                                                        <span className="badge bg-success">{p.salePercentage}% OFF</span>
                                                    ) : (
                                                        <span className="badge bg-secondary">אין מבצע</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <button className="btn btn-sm btn-info me-2" onClick={() => handleOpenSaleModal(p)}>ערוך מבצע</button>
                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteProduct(p.id)}>מחק</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {currentView === 'orders' && <OrdersView />}
                </div>
                {showModal && (
                    <CustomModal show={showModal} onHide={() => setShowModal(false)} title={editingProduct ? "Edit Product" : "Add Product"}>
                        <ProductForm
                            onSave={handleSave}
                            product={editingProduct}
                            categories={activeCategories}
                            allProducts={allProducts}
                        />
                    </CustomModal>
                )}
                {showSaleModal && (
                    <SaleModal
                        product={saleProduct}
                        onClose={handleCloseSaleModal}
                        onSave={handleSaveSale}
                    />
                )}
                {showCouponModal && (
                    <CouponModal show={showCouponModal} onHide={() => setShowCouponModal(false)} />
                )}
                <CustomModal
                    show={showTrash}
                    onHide={() => setShowTrash(false)}
                    title="פריטים שנמחקו"
                >
                    <div className="trash-section">
                        <h5>מוצרים</h5>
                        <table className="table table-sm">
                            <thead>
                                <tr>
                                    <th>שם</th>
                                    <th>פעולות</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inactiveProducts.map(p => (
                                    <tr key={p.id}>
                                        <td>{p.name}</td>
                                        <td>
                                            <button className="btn btn-sm btn-outline-success" onClick={() => handleRestoreProduct(p.id)}>שחזר</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="trash-section">
                        <h5>קטגוריות</h5>
                        <table className="table table-sm">
                            <thead>
                                <tr>
                                    <th>שם</th>
                                    <th>פעולות</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inactiveCategories.map(c => (
                                    <tr key={c.id}>
                                        <td>{c.name} (קטגוריה)</td>
                                        <td>
                                            <button className="btn btn-sm btn-outline-success" onClick={() => handleRestoreCategory(c.id)}>שחזר</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CustomModal>
            </div>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept="image/*"
            />
        </>
    );
};

export default AdminHome; 