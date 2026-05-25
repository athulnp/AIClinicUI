const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiError extends Error {
  status: number;
  errors: string[];

  constructor(message: string, status: number, errors: string[] = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function getSelectedClinicId(): number | null {
  const v = localStorage.getItem('selectedClinicId');
  return v ? Number(v) : null;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const clinicId = getSelectedClinicId();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) headers.Authorization = `Bearer ${token}`;
  if (clinicId) headers['X-Clinic-Id'] = String(clinicId);

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    mode: 'cors',
    credentials: 'include',
  };

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, fetchOptions);
  } catch (error) {
    // Handle network errors including CORS
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError(
        'Network error: Unable to connect to the API server. This may be a CORS configuration issue on the backend. Please ensure the backend allows requests from this origin.',
        0,
        ['CORS_ERROR']
      );
    }
    throw new ApiError(
      'Network error: Unable to connect to the API server. Please check your internet connection.',
      0,
      ['NETWORK_ERROR']
    );
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const body = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const errors: string[] = [];
    if (body?.errors) {
      if (Array.isArray(body.errors)) errors.push(...body.errors);
      else if (typeof body.errors === 'object')
        Object.values(body.errors).forEach((v) =>
          Array.isArray(v) ? errors.push(...(v as string[])) : errors.push(String(v)),
        );
    }
    throw new ApiError(body?.message || body?.title || res.statusText, res.status, errors);
  }

  return body as T;
}
