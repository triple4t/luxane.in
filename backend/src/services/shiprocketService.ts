import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const SHIPROCKET_BASE = 'https://apiv2.shiprocket.in/v1/external';

let cachedToken: string | null = null;
let tokenExpiry: number = 0;
const TOKEN_VALIDITY_MS = 9 * 24 * 60 * 60 * 1000; // refresh before 10-day expiry

function isConfigured(): boolean {
  return !!(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_API_PASSWORD);
}

export async function getShiprocketToken(): Promise<string | null> {
  if (!isConfigured()) return null;

  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const { data } = await axios.post<{ token: string }>(
      `${SHIPROCKET_BASE}/auth/login`,
      {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_API_PASSWORD,
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );

    if (data?.token) {
      cachedToken = data.token;
      tokenExpiry = Date.now() + TOKEN_VALIDITY_MS;
      return data.token;
    }
  } catch (err) {
    console.error('Shiprocket auth failed:', (err as Error).message);
  }
  return null;
}

export type ShiprocketOrderInput = {
  orderId: string;
  orderDate: string;
  total: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  items: Array<{ name: string; sku: string; quantity: number; price: number }>;
};

export async function createShiprocketOrder(
  input: ShiprocketOrderInput
): Promise<{ order_id: number; shipment_id: number } | null> {
  const token = await getShiprocketToken();
  if (!token) {
    console.warn('[Shiprocket] Create order skipped: no auth token (check SHIPROCKET_EMAIL and SHIPROCKET_API_PASSWORD)');
    return null;
  }

  const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary';

  const payload = {
    order_id: input.orderId,
    order_date: input.orderDate,
    pickup_location: pickupLocation,
    channel_id: '',
    comment: 'Order from website',
    billing_customer_name: input.customerName,
    billing_last_name: '',
    billing_address: input.addressLine1,
    billing_address_2: input.addressLine2 || '',
    billing_city: input.city,
    billing_pincode: input.postalCode,
    billing_state: input.state,
    billing_country: input.country,
    billing_email: input.customerEmail,
    billing_phone: input.customerPhone,
    shipping_is_billing: true,
    shipping_customer_name: input.customerName,
    shipping_last_name: '',
    shipping_address: input.addressLine1,
    shipping_address_2: input.addressLine2 || '',
    shipping_city: input.city,
    shipping_pincode: input.postalCode,
    shipping_state: input.state,
    shipping_country: input.country,
    shipping_email: input.customerEmail,
    shipping_phone: input.customerPhone,
    order_items: input.items.map((item) => ({
      name: item.name,
      sku: item.sku,
      units: item.quantity,
      selling_price: item.price,
    })),
    payment_method: 'prepaid',
    sub_total: input.total,
    length: 10,
    breadth: 10,
    height: 10,
    weight: Math.max(0.5, input.items.reduce((sum, i) => sum + i.quantity, 0) * 0.5),
  };

  try {
    const response = await axios.post(
      `${SHIPROCKET_BASE}/orders/create/adhoc`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000,
        validateStatus: () => true,
      }
    );

    const data = response.data as Record<string, unknown> | undefined;
    const status = response.status;

    if (status >= 400) {
      console.error('[Shiprocket] Create order API error:', status, data);
      return null;
    }

    const resPayload = (data?.data as Record<string, unknown>) ?? data;
    const orderId = resPayload?.order_id ?? resPayload?.orderId ?? data?.order_id ?? data?.orderId;
    const shipmentId = resPayload?.shipment_id ?? resPayload?.shipmentId ?? data?.shipment_id ?? data?.shipmentId;
    if (orderId != null && shipmentId != null) {
      return {
        order_id: Number(orderId),
        shipment_id: Number(shipmentId),
      };
    }

    console.warn('[Shiprocket] Create order response missing order_id/shipment_id. Full response:', JSON.stringify(data));
  } catch (err: unknown) {
    const axErr = err as { response?: { status?: number; data?: unknown }; message?: string };
    const msg = axErr.response?.data ?? axErr.message ?? err;
    console.error('[Shiprocket] Create order failed:', msg);
  }
  return null;
}

// Tracking response types (Shiprocket API shape may vary; we normalize)
export type ShiprocketTrackingScan = {
  date?: string;
  time?: string;
  activity?: string;
  location?: string;
  status?: string;
};

export type ShiprocketTrackingData = {
  awb_code?: string;
  courier_name?: string;
  current_status?: string;
  delivered_date?: string;
  scan?: ShiprocketTrackingScan[];
  tracking_data?: {
    track_status?: number;
    ship_status?: number;
    awb_code?: string;
    courier_company_name?: string;
    scan?: ShiprocketTrackingScan[];
  };
};

export async function getShiprocketTrackingByShipmentId(
  shipmentId: number
): Promise<ShiprocketTrackingData | null> {
  const token = await getShiprocketToken();
  if (!token) return null;

  try {
    const { data } = await axios.get<ShiprocketTrackingData>(
      `${SHIPROCKET_BASE}/courier/track/shipment/${shipmentId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      }
    );
    return data ?? null;
  } catch (err: unknown) {
    const res = err && typeof err === 'object' && 'response' in err ? (err as { response?: { status?: number } }).response : undefined;
    if (res?.status !== 404) {
      console.error('Shiprocket track by shipment failed:', (err as Error).message);
    }
    return null;
  }
}

export async function getShiprocketTrackingByOrderId(
  orderId: number
): Promise<ShiprocketTrackingData | null> {
  const token = await getShiprocketToken();
  if (!token) return null;

  try {
    const { data } = await axios.get<ShiprocketTrackingData>(
      `${SHIPROCKET_BASE}/courier/track/order/${orderId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      }
    );
    return data ?? null;
  } catch (err: unknown) {
    const res = err && typeof err === 'object' && 'response' in err ? (err as { response?: { status?: number } }).response : undefined;
    if (res?.status !== 404) {
      console.error('Shiprocket track by order failed:', (err as Error).message);
    }
    return null;
  }
}

export async function getShiprocketTrackingByAwb(
  awbCode: string
): Promise<ShiprocketTrackingData | null> {
  const token = await getShiprocketToken();
  if (!token) return null;

  try {
    const { data } = await axios.get<ShiprocketTrackingData>(
      `${SHIPROCKET_BASE}/courier/track/awb/${awbCode}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      }
    );
    return data ?? null;
  } catch (err: unknown) {
    const res = err && typeof err === 'object' && 'response' in err ? (err as { response?: { status?: number } }).response : undefined;
    if (res?.status !== 404) {
      console.error('Shiprocket track by AWB failed:', (err as Error).message);
    }
    return null;
  }
}
