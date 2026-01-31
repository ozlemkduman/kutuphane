// API Client - Merkezi HTTP istemcisi
// Token yönetimi, timeout ve hata işleme tek noktadan kontrol edilir

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const DEFAULT_TIMEOUT = 30000; // 30 saniye
const UPLOAD_TIMEOUT = 60000; // 60 saniye (dosya yükleme için)

export interface ApiError {
  message: string;
  statusCode?: number;
  code?: string; // Error code for programmatic handling
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  ok: boolean;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions {
  headers?: Record<string, string>;
  schoolId?: string; // For developer mode
  timeout?: number; // Custom timeout in ms
}

// Hata mesajları - tutarlı kullanıcı deneyimi için
const ERROR_MESSAGES: Record<string, string> = {
  NETWORK_ERROR: 'İnternet bağlantınızı kontrol edin',
  TIMEOUT: 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin',
  SERVER_ERROR: 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin',
  UNAUTHORIZED: 'Oturum süreniz doldu. Lütfen tekrar giriş yapın',
  FORBIDDEN: 'Bu işlem için yetkiniz yok',
  NOT_FOUND: 'İstenen kaynak bulunamadı',
  RATE_LIMIT: 'Çok fazla istek gönderildi. Lütfen biraz bekleyin',
  VALIDATION: 'Girilen bilgilerde hata var',
};

// Status code'a göre hata mesajı
function getErrorMessage(statusCode: number, serverMessage?: string): ApiError {
  if (serverMessage) {
    return { message: serverMessage, statusCode };
  }

  switch (statusCode) {
    case 401:
      return { message: ERROR_MESSAGES.UNAUTHORIZED, statusCode, code: 'UNAUTHORIZED' };
    case 403:
      return { message: ERROR_MESSAGES.FORBIDDEN, statusCode, code: 'FORBIDDEN' };
    case 404:
      return { message: ERROR_MESSAGES.NOT_FOUND, statusCode, code: 'NOT_FOUND' };
    case 429:
      return { message: ERROR_MESSAGES.RATE_LIMIT, statusCode, code: 'RATE_LIMIT' };
    case 422:
      return { message: ERROR_MESSAGES.VALIDATION, statusCode, code: 'VALIDATION' };
    default:
      if (statusCode >= 500) {
        return { message: ERROR_MESSAGES.SERVER_ERROR, statusCode, code: 'SERVER_ERROR' };
      }
      return { message: 'Bir hata oluştu', statusCode };
  }
}

// Token getter fonksiyonu - AuthContext'ten alınacak
let tokenGetter: (() => Promise<string | null>) | null = null;

export function setTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter;
}

async function getAuthHeaders(options?: RequestOptions): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  if (tokenGetter) {
    const token = await tokenGetter();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Developer mode - school id header
  if (options?.schoolId) {
    headers['X-School-Id'] = options.schoolId;
  }

  return headers;
}

async function request<T>(
  endpoint: string,
  method: HttpMethod,
  body?: unknown,
  options?: RequestOptions
): Promise<ApiResponse<T>> {
  const timeout = options?.timeout || DEFAULT_TIMEOUT;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const headers = await getAuthHeaders(options);

    // FormData için Content-Type header'ı kaldır
    if (body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 204 No Content
    if (response.status === 204) {
      return { data: null, error: null, ok: true };
    }

    const contentType = response.headers.get('content-type');
    let data: T | null = null;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      const serverMessage = (data as any)?.message;
      return {
        data: null,
        error: getErrorMessage(response.status, serverMessage),
        ok: false,
      };
    }

    return { data, error: null, ok: true };
  } catch (err: any) {
    clearTimeout(timeoutId);

    // Timeout hatası
    if (err.name === 'AbortError') {
      return {
        data: null,
        error: { message: ERROR_MESSAGES.TIMEOUT, code: 'TIMEOUT' },
        ok: false,
      };
    }

    // Network hatası
    return {
      data: null,
      error: { message: ERROR_MESSAGES.NETWORK_ERROR, code: 'NETWORK_ERROR' },
      ok: false,
    };
  }
}

// API Methods
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, 'GET', undefined, options),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, 'POST', body, options),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, 'PUT', body, options),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, 'PATCH', body, options),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, 'DELETE', undefined, options),

  // Upload için özel metod (daha uzun timeout)
  upload: async <T>(endpoint: string, file: File, options?: RequestOptions): Promise<ApiResponse<T>> => {
    const formData = new FormData();
    formData.append('file', file);
    return request<T>(endpoint, 'POST', formData, {
      ...options,
      timeout: options?.timeout || UPLOAD_TIMEOUT,
    });
  },
};

// Yardımcı hook için export
export function createApiHook(getToken: () => Promise<string | null>) {
  setTokenGetter(getToken);
  return api;
}

// Hata yardımcıları
export const ApiErrorCodes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  SERVER_ERROR: 'SERVER_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT: 'RATE_LIMIT',
  VALIDATION: 'VALIDATION',
} as const;

// Hata koduna göre kullanıcı aksiyonu önerisi
export function getErrorAction(code?: string): string | null {
  switch (code) {
    case 'UNAUTHORIZED':
      return 'Lütfen tekrar giriş yapın';
    case 'RATE_LIMIT':
      return 'Birkaç saniye bekleyip tekrar deneyin';
    case 'NETWORK_ERROR':
      return 'İnternet bağlantınızı kontrol edin';
    case 'TIMEOUT':
      return 'Sayfayı yenileyip tekrar deneyin';
    default:
      return null;
  }
}

// Response'dan hata mesajı çıkar
export function extractErrorMessage(response: ApiResponse<any>): string {
  return response.error?.message || 'Bir hata oluştu';
}

export default api;
