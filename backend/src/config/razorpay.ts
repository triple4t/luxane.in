import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials are missing in environment variables');
}

export const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

import crypto from 'crypto';

export const verifyPaymentSignature = (
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
): boolean => {
    const secret = process.env.RAZORPAY_KEY_SECRET!;

    const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

    return generatedSignature === razorpaySignature;
};

export const verifyWebhookSignature = (
    payload: string,
    signature: string
): boolean => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET!;

    const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

    return generatedSignature === signature;
};

export default razorpay;

