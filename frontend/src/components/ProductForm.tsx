import React, { useState, useEffect } from 'react';
import CustomModal from './CustomModal';
import { Product } from '../types/Product';
import { Category } from '../types/Category';
import { db, storage } from '../firebase';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface ProductFormProps {
    show: boolean;
    onHide: () => void;
    onSave: () => void;
    product: Product | null;
    categories: Category[];
    allProducts: Product[]; // For validation
}

const ProductForm: React.FC<ProductFormProps> = ({ show, onHide, onSave, product, categories, allProducts }) => {
    const [formData, setFormData] = useState<Partial<Product>>({
        name: '',
        description: '',
        price: 0,
        image: '',
        categoryId: '',
        quantity: 0,
        isAvailable: true,
        isActive: true
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (product) {
            setFormData(product);
        } else {
            setFormData({ name: '', description: '', price: 0, image: '', categoryId: '', quantity: 0, isAvailable: true, isActive: true });
        }
        setImageFile(null);
        setError(null);
    }, [product, show]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'price' || name === 'quantity' ? Number(value) : value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!product && allProducts.some(p => p.name.toLowerCase() === formData.name?.toLowerCase())) {
            setError("A product with this name already exists.");
            return;
        }

        setIsSubmitting(true);
        try {
            let imageUrl = formData.image;
            if (imageFile) {
                // For a new product, we need an ID for the storage path
                const docId = product ? product.id : doc(collection(db, 'products')).id;
                const storageRef = ref(storage, `products/${docId}/${imageFile.name}`);
                await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(storageRef);
            }

            const dataToSave = {
                ...formData,
                image: imageUrl,
                categoryRef: doc(db, 'categories', formData.categoryId!),
                isActive: formData.isActive !== false,
                isAvailable: formData.isAvailable !== false
            };

            if (product) {
                // Update existing product
                const productRef = doc(db, 'products', product.id);
                await updateDoc(productRef, dataToSave);
            } else {
                // Add new product
                await addDoc(collection(db, 'products'), dataToSave);
            }
            onSave();
            onHide();
        } catch (error) {
            console.error("Error saving product: ", error);
            setError("Failed to save product.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <CustomModal show={show} onHide={onHide} title={product ? 'ערוך מוצר' : 'הוסף מוצר חדש'}>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">שם המוצר</label>
                    <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                    <label className="form-label">תיאור</label>
                    <textarea className="form-control" rows={3} name="description" value={formData.description} onChange={handleChange} required />
                </div>
                <div className="row">
                    <div className="col">
                        <div className="mb-3">
                            <label className="form-label">מחיר</label>
                            <input type="number" className="form-control" name="price" value={formData.price} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="col">
                        <div className="mb-3">
                            <label className="form-label">כמות</label>
                            <input type="number" className="form-control" name="quantity" value={formData.quantity} onChange={handleChange} required />
                        </div>
                    </div>
                </div>
                <div className="mb-3">
                    <label className="form-label">תמונה</label>
                    <input type="file" className="form-control" onChange={handleFileChange} accept="image/*" />
                    {product?.image && !imageFile && <img src={product.image} alt="current" style={{ maxWidth: '100px', marginTop: '10px' }} />}
                </div>
                <div className="mb-3">
                    <label className="form-label">קטגוריה</label>
                    <select className="form-select" name="categoryId" value={formData.categoryId} onChange={handleChange} required>
                        <option value="">בחר קטגוריה</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
                {error && <p className="text-danger">{error}</p>}
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'שומר...' : 'שמור שינויים'}
                </button>
            </form>
        </CustomModal>
    );
};

export default ProductForm; 