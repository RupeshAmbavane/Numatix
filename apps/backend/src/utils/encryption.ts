import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';
const ALGORITHM = 'aes-256-cbc';

if (!ENCRYPTION_KEY) {
    console.warn(
        'WARNING: ENCRYPTION_KEY not set. API keys will use base64 encoding (not secure).'
    );
}

export function encrypt(text: string): string {
    if (!ENCRYPTION_KEY) {
        // Fallback: base64 encoding (not secure, but better than plaintext)
        return Buffer.from(text).toString('base64');
    }
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
        ALGORITHM,
        Buffer.from(ENCRYPTION_KEY, 'hex'),
        iv
    );
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(text: string): string {
    if (!ENCRYPTION_KEY) {
        // Fallback: base64 decoding
        return Buffer.from(text, 'base64').toString('utf8');
    }
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        Buffer.from(ENCRYPTION_KEY, 'hex'),
        iv
    );
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
