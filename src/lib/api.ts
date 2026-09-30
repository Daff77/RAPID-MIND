/**
 * RAPID-MIND Centralized API Client
 * Interfaces with Laravel 13 Sanctum backend.
 */

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
  code?: string;
}

const STORAGE_KEY_TOKEN = 'rapidmind_sanctum_token';

class ApiClient {
  private baseUrl: string;

  constructor() {
    const env = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env : {};
    this.baseUrl = (env.VITE_API_URL as string) || 'http://localhost:8000/api';
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  }

  public setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
  }

  public clearToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  }

  private getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...customHeaders,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    let body: any = null;
    try {
      body = isJson ? await response.json() : await response.text();
    } catch {
      body = null;
    }

    if (!response.ok) {
      const error: ApiError = {
        statusCode: response.status,
        message: body?.message || response.statusText || 'Terjadi kesalahan jaringan atau server',
        errors: body?.errors,
        code: `HTTP_${response.status}`,
      };

      // Handle 401 Unauthorized globally
      if (response.status === 401) {
        this.clearToken();
      }

      throw error;
    }

    return body as T;
  }

  public async get<T>(endpoint: string, queryParams?: Record<string, string | number | boolean | undefined>): Promise<T> {
    let url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    if (queryParams) {
      const filteredParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          filteredParams.append(key, String(val));
        }
      });
      const queryString = filteredParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return await this.handleResponse<T>(res);
    } catch (err: any) {
      if (err.statusCode) throw err;
      throw {
        statusCode: 0,
        message: 'Koneksi ke server pusat terputus (Offline). Operasi dialihkan ke penyimpanan lokal IndexedDB.',
        code: 'NETWORK_OFFLINE',
      } as ApiError;
    }
  }

  public async post<T>(endpoint: string, data?: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: data !== undefined ? JSON.stringify(data) : undefined,
      });
      return await this.handleResponse<T>(res);
    } catch (err: any) {
      if (err.statusCode) throw err;
      throw {
        statusCode: 0,
        message: 'Koneksi ke server pusat terputus (Offline). Operasi dialihkan ke penyimpanan lokal IndexedDB.',
        code: 'NETWORK_OFFLINE',
      } as ApiError;
    }
  }

  public async patch<T>(endpoint: string, data?: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: data !== undefined ? JSON.stringify(data) : undefined,
      });
      return await this.handleResponse<T>(res);
    } catch (err: any) {
      if (err.statusCode) throw err;
      throw {
        statusCode: 0,
        message: 'Koneksi ke server pusat terputus (Offline). Operasi dialihkan ke penyimpanan lokal IndexedDB.',
        code: 'NETWORK_OFFLINE',
      } as ApiError;
    }
  }

  public async delete<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      return await this.handleResponse<T>(res);
    } catch (err: any) {
      if (err.statusCode) throw err;
      throw {
        statusCode: 0,
        message: 'Koneksi ke server pusat terputus (Offline).',
        code: 'NETWORK_OFFLINE',
      } as ApiError;
    }
  }
}

export const apiClient = new ApiClient();
