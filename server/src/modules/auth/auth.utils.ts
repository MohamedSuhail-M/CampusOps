import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'campusops_secret_session_key_2026_lowkey_coders';
const SESSION_MAX_AGE_MS = parseInt(process.env.SESSION_MAX_AGE_MS || '86400000', 10); // 24 hours

export interface SessionPayload {
  userId: string;
  loginId: string;
  activeRole: string;
  exp: number;
}

export function signSession(userId: string, loginId: string, activeRole: string): string {
  const exp = Date.now() + SESSION_MAX_AGE_MS;
  const payload: SessionPayload = { userId, loginId, activeRole, exp };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${signature}`;
}

export function verifySession(token: string): SessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadB64, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payloadB64)
      .digest('base64url');
    
    // Constant-time buffer comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    if (Date.now() > payload.exp) {
      return null; // Expired session
    }
    return payload;
  } catch {
    return null;
  }
}
