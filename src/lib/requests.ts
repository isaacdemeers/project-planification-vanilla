export type Intervenant = {
  id: string;
  name: string;
  lastname: string;
  availabilities: object;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export async function getIntervenants(): Promise<Intervenant[]> {
  try {
    const response = await fetch('/api/intervenant');
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  } catch (error) {
    console.error('Error fetching intervenants:', error);
    return [];
  }
}

export async function createIntervenant(intervenant: Omit<Intervenant, 'id' | 'created_at' | 'updated_at'>): Promise<Intervenant> {
  const response = await fetch('/api/intervenant', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(intervenant),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Server error:', data);
    throw new Error(data.error || 'Failed to create intervenant');
  }

  return data;
}

