/**
 * Central API Client Wrapper — Module 25 Hardened
 *
 * Supports all HTTP methods, attaches Bearer token automatically.
 * Never caches biometric, token, or sensitive admin data.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

interface FetchOptions extends RequestInit {
  data?: any;
}

export const api = async <T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
  const { data, method: explicitMethod, headers: customHeaders, ...customConfig } = options;

  const token = typeof window !== 'undefined' ? localStorage.getItem('attendx_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Determine HTTP method:
  // 1. Use explicit method if provided (DELETE, PATCH, PUT, etc.)
  // 2. Default to POST if data is present
  // 3. Default to GET otherwise
  const method = explicitMethod || (data ? 'POST' : 'GET');

  const config: RequestInit = {
    method,
    body: data ? JSON.stringify(data) : undefined,
    headers,
    ...customConfig,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // Handle 204 No Content (no body to parse)
  if (response.status === 204) return null as T;

  const responseData = await response.json();

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      // Token expired or session revoked — clear storage but don't redirect here
      // Let AuthContext handle it
    }
    if (response.status === 403 && typeof window !== 'undefined') {
      window.location.href = '/unauthorized';
    }
    throw new Error(responseData.error?.message || responseData.message || 'An API error occurred');
  }

  return responseData.data;
};
