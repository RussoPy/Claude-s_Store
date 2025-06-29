import React, { useState, useEffect } from 'react';
import { Coupon } from '../types/Coupon';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, doc, Timestamp, query, where, deleteDoc } from 'firebase/firestore';

interface CouponModalProps {
    onHide: () => void;
}

const CouponModal: React.FC<CouponModalProps> = ({ onHide }) => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state for new/editing coupon
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [couponCode, setCouponCode] = useState('');
    const [percentageOff, setPercentageOff] = useState(0);
    const [expiresAt, setExpiresAt] = useState('');

    const fetchCoupons = async () => {
        setIsLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'coupons'));
            const couponsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon));
            setCoupons(couponsData.sort((a, b) => b.expiresAt.toMillis() - a.expiresAt.toMillis()));
        } catch (err) {
            setError('Failed to fetch coupons.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!couponCode || !percentageOff || !expiresAt) {
            setError("Please fill all fields.");
            return;
        }

        // If not editing, check if coupon code already exists
        if (!editingCoupon) {
            const q = query(collection(db, "coupons"), where("code", "==", couponCode));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                setError("This coupon code already exists.");
                return;
            }
        }

        const dataToSave = {
            code: couponCode,
            percentageOff,
            expiresAt: Timestamp.fromDate(new Date(expiresAt)),
            isActive: editingCoupon ? editingCoupon.isActive : true,
        };

        try {
            if (editingCoupon) {
                const couponRef = doc(db, 'coupons', editingCoupon.id);
                await updateDoc(couponRef, dataToSave);
            } else {
                await addDoc(collection(db, 'coupons'), dataToSave);
            }
            resetForm();
            fetchCoupons();
        } catch (err) {
            setError(editingCoupon ? 'Failed to update coupon.' : 'Failed to create coupon.');
        }
    };

    const handleEditClick = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setCouponCode(coupon.code);
        setPercentageOff(coupon.percentageOff);
        // Format date for the input field
        const date = coupon.expiresAt.toDate();
        const formattedDate = date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
        setExpiresAt(formattedDate);
    };

    const resetForm = () => {
        setEditingCoupon(null);
        setCouponCode('');
        setPercentageOff(0);
        setExpiresAt('');
        setError(null);
    };

    const handleDeleteCoupon = async (couponId: string) => {
        if (window.confirm('Are you sure you want to permanently delete this coupon?')) {
            const couponRef = doc(db, 'coupons', couponId);
            try {
                await deleteDoc(couponRef);
                fetchCoupons(); // Refetch to show updated list
            } catch (err) {
                setError('Failed to delete coupon.');
            }
        }
    };

    const handleToggleActive = async (coupon: Coupon) => {
        const couponRef = doc(db, 'coupons', coupon.id);
        try {
            await updateDoc(couponRef, { isActive: !coupon.isActive });
            fetchCoupons(); // Refetch to show updated status
        } catch (err) {
            setError('Failed to update coupon status.');
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content" style={{ maxWidth: '800px' }}>
                <div className="modal-header" style={{ display: 'flex', alignItems: 'center' }}>
                <h5 className="modal-title" >נהל קופונים</h5>
                    <button type="button" className="btn-close" style={{ color: 'black', margin: 0 }} onClick={onHide}>&times;</button>
                   
                </div>
                <div className="modal-body">
                    {/* Form for creating a new coupon */}
                    <div className="card mb-4">
                        <div className="card-body">
                            <h5 className="card-title">{editingCoupon ? 'ערוך קופון' : 'צור קופון חדש'}</h5>
                            <form onSubmit={handleFormSubmit}>
                                <div className="row">
                                    <div className="col-md-4">
                                        <label className="form-label">קוד קופון</label>
                                        <input type="text" className="form-control" value={couponCode} onChange={e => setCouponCode(e.target.value)} required disabled={!!editingCoupon} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">אחוז הנחה</label>
                                        <input type="number" className="form-control" value={percentageOff} onChange={e => setPercentageOff(Number(e.target.value))} required min="1" max="100" />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">תאריך תפוגה</label>
                                        <input type="date" className="form-control" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} required />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary mt-3">{editingCoupon ? 'שמור שינויים' : 'צור קופון'}</button>
                                {editingCoupon && <button type="button" className="btn btn-secondary mt-3 ms-2" onClick={resetForm}>בטל</button>}
                            </form>
                        </div>
                    </div>

                    {/* Table of existing coupons */}
                    <h5>קופונים קיימים</h5>
                    {isLoading ? <p>טוען...</p> : error ? <p className="text-danger">{error}</p> : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>קוד</th>
                                    <th>הנחה</th>
                                    <th>בתוקף עד</th>
                                    <th>פעיל</th>
                                    <th>פעולות</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.map(coupon => (
                                    <tr key={coupon.id}>
                                        <td>{coupon.code}</td>
                                        <td>{coupon.percentageOff}%</td>
                                        <td>{coupon.expiresAt.toDate().toLocaleDateString('he-IL')}</td>
                                        <td>
                                            <div className="form-check form-switch d-flex justify-content-right">
                                                <input className="form-check-input" type="checkbox" checked={coupon.isActive} onChange={() => handleToggleActive(coupon)} />
                                            </div>
                                        </td>
                                        <td>
                                            <button className="btn btn-sm btn-secondary me-1" onClick={() => handleEditClick(coupon)}>ערוך</button>
                                            <button className="btn btn-sm btn-danger" onClick={() => handleDeleteCoupon(coupon.id)}>מחק</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CouponModal; 