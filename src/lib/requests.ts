export type Intervenant = {
  id: string;
  name: string;
  lastname: string;
  availabilities: object;
  email: string;
  connect_key: string;
  connect_key_created_at: Date;
  created_at: Date;
  updated_at: Date;
  connect_key_validity_days: number;
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

export async function createIntervenant(intervenant: Omit<Intervenant, 'id' | 'created_at' | 'updated_at' | 'connect_key_created_at'>): Promise<Intervenant> {
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

export async function updateIntervenant(id: string, intervenant: Partial<Omit<Intervenant, 'id' | 'created_at' | 'updated_at'>>): Promise<Intervenant> {
  const response = await fetch(`/api/intervenant/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(intervenant),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Server error:', data);
    throw new Error(data.error || 'Failed to update intervenant');
  }

  return data;
}

export async function deleteIntervenant(id: string): Promise<void> {
  const response = await fetch(`/api/intervenant/${id}`, {
    method: 'DELETE',
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Server error:', data);
    throw new Error(data.error || 'Failed to delete intervenant');
  }
}

export async function regenerateConnectKey(id: string): Promise<Intervenant> {
  const response = await fetch(`/api/intervenant/${id}/regenerate-key`, {
    method: 'POST',
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Server error:', data);
    throw new Error(data.error || 'Failed to regenerate connect key');
  }

  return data;
}

export async function regenerateAllKeys(): Promise<Intervenant[]> {
  const response = await fetch('/api/intervenant/regenerate-all-keys', {
    method: 'POST',
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Server error:', data);
    throw new Error(data.error || 'Failed to regenerate all keys');
  }

  return data;
}

