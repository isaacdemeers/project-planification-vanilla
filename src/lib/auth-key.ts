import db from './db.server';
import { Intervenant } from './requests';

type ValidationResult =
    | { type: 'success', intervenant: Intervenant }
    | { type: 'error', code: 'expired' | 'not_found' };

export async function validateConnectKey(key: string): Promise<ValidationResult> {
    try {
        // Vérifie si la clé existe et si elle est valide
        const result = await db.query(
            `SELECT *,
                (connect_key_created_at + (connect_key_validity_days || ' days')::interval) > NOW() as is_valid
            FROM "Intervenant"
            WHERE connect_key = $1`,
            [key]
        );

        if (result.rows.length === 0) {
            return { type: 'error', code: 'not_found' };
        }

        const intervenant = result.rows[0];

        if (!intervenant.is_valid) {
            return { type: 'error', code: 'expired' };
        }

        return {
            type: 'success',
            intervenant: {
                id: intervenant.id,
                name: intervenant.name,
                lastname: intervenant.lastname,
                email: intervenant.email,
                connect_key: intervenant.connect_key,
                connect_key_created_at: intervenant.connect_key_created_at,
                connect_key_validity_days: intervenant.connect_key_validity_days,
                created_at: intervenant.created_at,
                updated_at: intervenant.updated_at,
                availabilities: intervenant.availabilities
            }
        };
    } catch (error) {
        console.error('Error validating connect key:', error);
        return { type: 'error', code: 'not_found' };
    }
} 