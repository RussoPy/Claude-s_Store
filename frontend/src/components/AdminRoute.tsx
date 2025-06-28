import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AdminRoute: React.FC = () => {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const idTokenResult = await user.getIdTokenResult();
                setIsAdmin(!!idTokenResult.claims.admin);
            } else {
                setIsAdmin(false);
            }
        });

        return () => unsubscribe();
    }, []);

    if (isAdmin === null) {
        return <p>Loading...</p>; // Or a spinner
    }

    return isAdmin ? <Outlet /> : <Navigate to="/admin/login" />;
};

export default AdminRoute; 