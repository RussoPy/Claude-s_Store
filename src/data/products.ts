import { Product } from '../types/Product';

export const products: Product[] = [
    {
        id: 1,
        name: 'Margherita Pizza',
        description: 'Classic pizza with tomatoes, mozzarella, and basil.',
        price: 12.99,
        image: '/assets/images/margherita.jpg',
    },
    {
        id: 2,
        name: 'Pepperoni Pizza',
        description: 'Pizza with pepperoni and cheese.',
        price: 14.99,
        image: '/assets/images/pepperoni.jpg',
    },
    {
        id: 3,
        name: 'Vegetarian Pizza',
        description: 'Pizza with various vegetables.',
        price: 13.99,
        image: '/assets/images/vegetarian.jpg',
    },
    {
        id: 4,
        name: 'Spaghetti Carbonara',
        description: 'Pasta with eggs, cheese, pancetta, and pepper.',
        price: 15.99,
        image: '/assets/images/carbonara.jpg',
    },
    {
        id: 5,
        name: 'Lasagna',
        description: 'Layers of pasta with meat sauce and cheese.',
        price: 16.99,
        image: '/assets/images/lasagna.jpg',
    },
    {
        id: 6,
        name: 'Caesar Salad',
        description: 'Salad with romaine lettuce, croutons, and Caesar dressing.',
        price: 9.99,
        image: '/assets/images/caesar.jpg',
    },
]; 