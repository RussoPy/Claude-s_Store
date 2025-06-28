import React from 'react';
import CustomerHome from './CustomerHome';
import AdminHome from './AdminHome';

interface HomePageProps {
    onProductAdd?: () => void;
    onProductRemove?: () => void;
    isAdmin: boolean;
    authLoading: boolean;
}

const HomePage: React.FC<HomePageProps> = ({ onProductAdd, onProductRemove, isAdmin, authLoading }) => {
    if (authLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            {isAdmin ? (
                <AdminHome />
            ) : (
                <CustomerHome
                    onProductAdd={onProductAdd}
                    onProductRemove={onProductRemove}
                />
            )}
        </div>
    );
};

export default HomePage;