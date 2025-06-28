import React, { useState } from 'react';
import CustomerHome from './CustomerHome';
import AdminHome from './AdminHome';

interface HomePageProps {
    onProductAdd?: () => void;
    onProductRemove?: () => void;
    isAdmin: boolean;
    authLoading: boolean;
}

const HomePage: React.FC<HomePageProps> = ({ onProductAdd, onProductRemove, isAdmin, authLoading }) => {
    const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);
    const [hiddenProducts, setHiddenProducts] = useState<string[]>([]);

    if (authLoading) {
        return <p>Loading...</p>;
    }

    if (isAdmin) {
        return <AdminHome
            hiddenCategories={hiddenCategories}
            setHiddenCategories={setHiddenCategories}
            hiddenProducts={hiddenProducts}
            setHiddenProducts={setHiddenProducts}
        />;
    }

    return <CustomerHome onProductAdd={onProductAdd} onProductRemove={onProductRemove} hiddenCategories={hiddenCategories} />;
};

export default HomePage;