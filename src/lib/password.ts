async function bufferToHex(buffer: ArrayBuffer): Promise<string> {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

export function generateSalt(): string {
    return crypto.randomUUID();
}

export async function hashPassword(password: string, salt: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return bufferToHex(hash);
}

export async function verifyPassword(password: string, salt: string, hash: string): Promise<boolean> {
    const computedHash = await hashPassword(password, salt);
    return computedHash === hash;
} 