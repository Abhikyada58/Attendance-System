/**
 * Central API Client Wrapper
 * 
 * WHY THIS EXISTS:
 * Instead of writing `fetch('http://localhost:5000/api/v1/...')` and manually attaching
 * the Bearer token in every component, we centralize API calls here.
 * If the JWT is stored in localStorage, this wrapper automatically attaches it.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

interface FetchOptions extends RequestInit {
  data?: any;
}

export const api = async <T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
  const { data, headers: customHeaders, ...customConfig } = options;

  // Retrieve token from localStorage (this runs only in the browser)
  const token = typeof window !== 'undefined' ? localStorage.getItem('attendx_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  // If we have a token, attach it for protected routes
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method: data ? 'POST' : 'GET',
    body: data ? JSON.stringify(data) : undefined,
    headers,
    ...customConfig,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const responseData = await response.json();

  if (!response.ok) {
    // If it's a 403 Forbidden (e.g., Suspended or lacking role permissions)
    if (response.status === 403 && typeof window !== 'undefined') {
      window.location.href = '/unauthorized';
    }
    
    // Standardize error throwing based on our backend's `sendError` format
    throw new Error(responseData.message || 'An API error occurred');
  }

  // Our backend returns { success, message, data }
  return responseData.data;
};
