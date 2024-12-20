import { randomBytes, pbkdf2Sync } from 'crypto';

export function generateSalt(): string {
    return randomBytes(16).toString('hex');
}

export async function hashPassword(password: string, salt: string): Promise<string> {
    return pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export async function verifyPassword(
    inputPassword: string,
    salt: string,
    storedHash: string
): Promise<boolean> {
    const inputHash = await hashPassword(inputPassword, salt);
    return inputHash === storedHash;
} 