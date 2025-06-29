import { Timestamp } from 'firebase/firestore';

export interface Coupon {
    id: string;
    code: string;
    percentageOff: number;
    expiresAt: Timestamp;
    isActive: boolean;
} 