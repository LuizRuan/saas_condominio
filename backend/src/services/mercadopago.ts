const MP_BASE = 'https://api.mercadopago.com';

export class MPApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(`MP API ${statusCode}: ${message}`);
  }
}

interface MPAutoRecurring {
  frequency: number;
  frequency_type: 'months' | 'days';
  transaction_amount: number;
  currency_id: string;
}

export interface MPPreapprovalCreateData {
  reason: string;
  auto_recurring: MPAutoRecurring;
  back_url: string;
  payer_email: string;
  external_reference: string;
  status: 'pending';
}

export interface MPPreapprovalResponse {
  id: string;
  status: string;
  init_point: string;
  sandbox_init_point?: string;
  external_reference?: string;
  summarized?: {
    next_payment_date?: string;
  };
}

async function mpFetch(path: string, options?: RequestInit): Promise<any> {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado');
  }
  const res = await fetch(`${MP_BASE}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...((options?.headers as Record<string, string>) ?? {}),
    },
  });
  if (!res.ok) {
    const body: any = await res.json().catch(() => ({}));
    throw new MPApiError(res.status, body?.message ?? 'erro desconhecido', {
      error: body?.error,
      cause: body?.cause,
      status: body?.status,
    });
  }
  return res.json();
}

export async function createPreapproval(data: MPPreapprovalCreateData): Promise<MPPreapprovalResponse> {
  return mpFetch('/preapproval', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getPreapproval(id: string): Promise<MPPreapprovalResponse> {
  return mpFetch(`/preapproval/${encodeURIComponent(id)}`);
}

export async function cancelPreapproval(id: string): Promise<MPPreapprovalResponse> {
  return mpFetch(`/preapproval/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'canceled' }),
  });
}
