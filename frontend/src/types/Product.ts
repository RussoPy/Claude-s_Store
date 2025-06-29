export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    categoryId: string;
    quantity?: number;
    isAvailable?: boolean;
    isActive?: boolean;
    isOnSale?: boolean;
    salePercentage?: number;
}