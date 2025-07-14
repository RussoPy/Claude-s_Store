import { Product } from './Product';

export interface ShippingAddress {
    address_line_1: string;
    admin_area_2: string;
    country_code: string;
    postal_code: string;
}

export interface Order {
    id: string;
    amount: {
        currency_code: string;
        value: string;
    };
    coupon_used: string | null;
    created_at: {
        seconds: number;
        nanoseconds: number;
    };
    customer_name: string;
    discount_percentage: number;
    items: (Product & { quantity: number })[];
    order_id: string;
    payer_email: string;
    payment_time: string;
    paypal_capture_id: string;
    shipping_address: ShippingAddress;
    shipping_method: 'pickup' | 'delivery';
    status: string;
} 