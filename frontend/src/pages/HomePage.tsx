import React, { useState } from 'react';
import CustomerHome from './CustomerHome';
import AdminHome from './AdminHome';
import { Product } from '../types/Product';

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
        return <div>Loading...</div>;
    }

    return (
        <div>
            {isAdmin ? (
                <AdminHome
                    hiddenCategories={hiddenCategories}
                    setHiddenCategories={setHiddenCategories}
                    hiddenProducts={hiddenProducts}
                    setHiddenProducts={setHiddenProducts}
                />
            ) : (
                <CustomerHome
                    onProductAdd={onProductAdd}
                    onProductRemove={onProductRemove}
                    hiddenCategories={hiddenCategories}
                    hiddenProducts={hiddenProducts}
                />
            )}
        </div>
    );
};

export default HomePage;