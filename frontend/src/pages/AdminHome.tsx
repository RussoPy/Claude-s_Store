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

const EditableField = ({ value, onSave, label }: { value: string | number, onSave: (newValue: string | number) => void, label: string }) => {
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
                aria-label={label}
                style={{ width: '100%' }}
            />
        );
    }

    return (
        <button onClick={() => setIsEditing(true)} className="editable-field-button" aria-label={`Edit ${label}`}>
            {value}
        </button>
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
        // TODO: Replace with an accessible confirmation modal
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
        // TODO: Replace with an accessible prompt/form modal
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
        // TODO: Replace with an accessible confirmation modal
        if (window.confirm(`Are you sure you want to hide this category?`)) {
            const categoryRef = doc(db, 'categories', categoryId);
            await updateDoc(categoryRef, { isActive: false });
            if (selectedCategory === categoryId) {
                setSelectedCategory(null);
            }
            fetchProducts();
        }
    };

    const handleCategoryContextMenu = (e: React.MouseEvent, categoryId: string) => {
        e.preventDefault();
        handleHideCategory(categoryId);
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
        <div>
            <h1>ניהול חנות</h1>
            <button onClick={handleLogout}>התנתק</button>
            <button onClick={handleAddProduct}>+ הוסף מוצר</button>
            <button onClick={handleAddCategory}>+ הוסף קטגוריה</button>
            <button onClick={() => setShowCouponModal(true)}>נהל קופונים</button>
            <button onClick={() => setShowTrash(!showTrash)}>{showTrash ? "הצג מוצרים פעילים" : "הצג אשפה"}</button>

            <CustomModal show={showModal} onHide={() => setShowModal(false)} title={editingProduct ? 'ערוך מוצר' : 'הוסף מוצר חדש'}>
                <ProductForm
                    onSave={handleSave}
                    product={editingProduct}
                    categories={categories.filter(c => c.isActive)}
                    allProducts={allProducts}
                />
            </CustomModal>

            <SaleModal product={saleProduct} onClose={handleCloseSaleModal} onSave={handleSaveSale} />
            <CouponModal show={showCouponModal} onHide={() => setShowCouponModal(false)} />

            <div className="admin-controls">
                {/* Category filters etc */}
            </div>

            <div role="status" aria-live="polite">
                {loading && <p>טוען...</p>}
                {error && <p className="text-danger">{error}</p>}
            </div>

            <table className="table admin-product-table">
                <thead>
                    <tr>
                        <th scope="col">תמונה</th>
                        <th scope="col">שם</th>
                        <th scope="col">תיאור</th>
                        <th scope="col">מחיר</th>
                        <th scope="col">כמות</th>
                        <th scope="col">פעולות</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(product => (
                        <tr key={product.id}>
                            <td>
                                <div className="product-image-container">
                                    <img src={product.image} alt={product.name} className="product-image-thumb" />
                                    <button
                                        className="edit-image-btn"
                                        onClick={() => handleImageUploadClick(product.id)}
                                        aria-label={`Change image for ${product.name}`}
                                    >
                                        ✏️
                                    </button>
                                </div>
                            </td>
                            <td><EditableField value={product.name} onSave={(val) => handleFieldUpdate(product.id, 'name', val)} label="שם מוצר" /></td>
                            <td><EditableField value={product.description} onSave={(val) => handleFieldUpdate(product.id, 'description', val)} label="תיאור מוצר" /></td>
                            <td><EditableField value={product.price} onSave={(val) => handleFieldUpdate(product.id, 'price', val)} label="מחיר" /></td>
                            <td><EditableField value={product.quantity ?? 0} onSave={(val) => handleFieldUpdate(product.id, 'quantity', val)} label="כמות" /></td>
                            <td>
                                <button onClick={() => { setEditingProduct(product); setShowModal(true); }}>ערוך</button>
                                <button onClick={() => handleDeleteProduct(product.id)}>מחק</button>
                                <button onClick={() => handleOpenSaleModal(product)}>הנחה</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Hidden file input */}
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept="image/*"
            />
        </div>
    );
};

export default AdminHome; 