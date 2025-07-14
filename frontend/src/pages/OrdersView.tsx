import React, { useEffect, useState } from 'react';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { Order } from '../types/Order';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../AdminHome.css';

const OrdersView: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const ordersQuery = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
            const ordersSnap = await getDocs(ordersQuery);
            const ordersData: Order[] = ordersSnap.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data
                } as Order;
            });
            setOrders(ordersData);
            setFilteredOrders(ordersData);
        } catch (err) {
            setError('שגיאה בטעינת ההזמנות');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filtered = orders.filter(order => {
            return (
                order.customer_name.toLowerCase().includes(lowercasedFilter) ||
                order.payer_email.toLowerCase().includes(lowercasedFilter) ||
                order.order_id.toLowerCase().includes(lowercasedFilter) ||
                order.id.toLowerCase().includes(lowercasedFilter)
            );
        });
        setFilteredOrders(filtered);
    }, [searchTerm, orders]);

    const formatTimestamp = (timestamp: any) => {
        if (!timestamp || !timestamp.seconds) {
            return 'N/A';
        }
        return new Date(timestamp.seconds * 1000).toLocaleString('he-IL');
    };

    if (loading) {
        return <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}><h2>טוען...</h2></div>;
    }

    if (error) {
        return <div className="alert alert-danger">{error}</div>;
    }

    return (
        <div className="admin-home-container" style={{ padding: '20px' }}>
            <h1>ניהול הזמנות</h1>
            <div className="mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="חפש לפי שם לקוח, אימייל, או מספר הזמנה..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="table-responsive">
                <table className="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>תאריך</th>
                            <th>שם לקוח</th>
                            <th>אימייל</th>
                            <th>מספר הזמנה</th>
                            <th>סכום</th>
                            <th>סטטוס</th>
                            <th>שיטת משלוח</th>
                            <th>פרטי הזמנה</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.map(order => (
                            <tr key={order.id}>
                                <td>{formatTimestamp(order.created_at)}</td>
                                <td>{order.customer_name}</td>
                                <td>{order.payer_email}</td>
                                <td>{order.order_id}</td>
                                <td>{order.amount.value} {order.amount.currency_code}</td>
                                <td><span className={`badge ${order.status === 'COMPLETED' ? 'bg-success' : 'bg-warning'}`}>{order.status === 'COMPLETED' ? 'שולם' : order.status}</span></td>
                                <td>{order.shipping_method === 'pickup' ? 'איסוף עצמי' : 'משלוח'}</td>
                                <td>
                                    {order.items.map(item => (
                                        <div key={item.id}>{item.name} (x{item.quantity})</div>
                                    ))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OrdersView; 