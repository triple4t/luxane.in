import axios from 'axios';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;
const VERIFY_BASE = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}`;

/**
 * Normalize phone to E.164 for Twilio (e.g. 10-digit Indian -> +917507693344)
 */
export function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  return phone.startsWith('+') ? phone : `+${digits}`;
}

function getAuthHeader(): string {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error('Twilio credentials not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)');
  }
  const encoded = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
  return `Basic ${encoded}`;
}

/**
 * Send OTP to phone via Twilio Verify (SMS channel)
 */
export async function sendVerification(phone: string): Promise<void> {
  if (!TWILIO_VERIFY_SERVICE_SID) {
    throw new Error('Twilio Verify Service SID not configured (TWILIO_VERIFY_SERVICE_SID)');
  }
  const to = toE164(phone);
  await axios.post(
    `${VERIFY_BASE}/Verifications`,
    new URLSearchParams({ To: to, Channel: 'sms' }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: getAuthHeader(),
      },
    }
  );
}

/**
 * Verify OTP code with Twilio Verify
 */
export async function verifyCode(phone: string, code: string): Promise<boolean> {
  if (!TWILIO_VERIFY_SERVICE_SID) {
    throw new Error('Twilio Verify Service SID not configured (TWILIO_VERIFY_SERVICE_SID)');
  }
  const to = toE164(phone);
  console.log(`[Twilio] Verifying code for phone: ${to}, code: ${code}`);
  try {
    const res = await axios.post(
      `${VERIFY_BASE}/VerificationCheck`,
      new URLSearchParams({ To: to, Code: code }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: getAuthHeader(),
        },
      }
    );
    console.log(`[Twilio] Verification response:`, res.data);
    return res.data?.status === 'approved';
  } catch (err: any) {
    console.error(`[Twilio] Verification error for ${to}:`, err.response?.data || err.message);
    if (err.response?.status === 404 || err.response?.data?.code === 60200) {
      return false;
    }
    throw err;
  }
}
