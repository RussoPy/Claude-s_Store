import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { CartItem } from '../types/CartItem';
import { Product } from '../types/Product';
import { db } from '../firebase';
import { collection, doc, getDoc, setDoc, updateDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { getGuestSessionId } from '../utils/guestSession';
import { rateLimiter } from '../utils/rateLimiter';

interface CartContextType {
    cartItems: CartItem[];
    isCartOpen: boolean;
    addToCart: (product: Product) => void;
    decrementFromCart: (productId: string) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    getCartTotal: () => number;
    toggleCart: () => void;
    openCart: () => void;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const sessionId = getGuestSessionId();
    const cartDocRef = doc(db, 'carts', sessionId);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Sync cart from Firestore on mount and on changes
    useEffect(() => {
        const unsubscribe = onSnapshot(cartDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setCartItems(docSnap.data().items || []);
            } else {
                setCartItems([]);
            }
        });
        return unsubscribe;
    }, [sessionId]);

    // Helper to sanitize cart items (remove undefined fields)
    const sanitizeCartItems = (items: CartItem[]): CartItem[] =>
        items.map(item => {
            const sanitized: Partial<CartItem> = {};
            (Object.keys(item) as (keyof CartItem)[]).forEach(key => {
                if (item[key] !== undefined) sanitized[key] = item[key] as any;
            });
            return sanitized as CartItem;
        });

    // Helper to update cart in Firestore
    const updateCartInFirestore = async (items: CartItem[]) => {
        await setDoc(cartDocRef, { sessionId, items: sanitizeCartItems(items) });
    };

    const toggleCart = () => setIsCartOpen(!isCartOpen);
    const openCart = () => setIsCartOpen(true);

    const addToCart = (product: Product) => {
        if (!rateLimiter.canRun('addToCart')) return;
        const price = product.isOnSale && product.salePercentage
            ? product.price * (1 - product.salePercentage / 100)
            : product.price;
        setCartItems(prevItems => {
            const itemInCart = prevItems.find(item => item.id === product.id);
            let newItems;
            if (itemInCart) {
                newItems = prevItems.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            } else {
                newItems = [...prevItems, { ...product, price, quantity: 1 }];
            }
            updateCartInFirestore(newItems);
            return newItems;
        });
        openCart();
    };

    const decrementFromCart = (productId: string) => {
        if (!rateLimiter.canRun('decrementFromCart')) return;
        setCartItems(prevItems => {
            const itemInCart = prevItems.find(item => item.id === productId);
            let newItems;
            if (itemInCart && itemInCart.quantity > 1) {
                newItems = prevItems.map(item =>
                    item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
                );
            } else {
                newItems = prevItems.filter(item => item.id !== productId);
            }
            updateCartInFirestore(newItems);
            return newItems;
        });
    };

    const removeFromCart = (productId: string) => {
        if (!rateLimiter.canRun('removeFromCart')) return;
        setCartItems(prevItems => {
            const newItems = prevItems.filter(item => item.id !== productId);
            updateCartInFirestore(newItems);
            return newItems;
        });
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (!rateLimiter.canRun('updateQuantity')) return;
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            setCartItems(prevItems => {
                const newItems = prevItems.map(item =>
                    item.id === productId ? { ...item, quantity } : item
                );
                updateCartInFirestore(newItems);
                return newItems;
            });
        }
    };

    const clearCart = async () => {
        setCartItems([]);
        await deleteDoc(cartDocRef);
    };

    const getCartTotal = () => {
        return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    };

    return (
        <CartContext.Provider
            value={{
                cartItems,
                isCartOpen,
                addToCart,
                decrementFromCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                getCartTotal,
                toggleCart,
                openCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};