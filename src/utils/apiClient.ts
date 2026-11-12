/**
 * WAQAS POS SOFTWARE - Robust API Client & Safe JSON Transport
 * Prevents "Unexpected token 'T', 'The page c'... is not valid JSON" errors
 * Supports both same-origin reverse-proxy and cross-origin separate backend deployments.
 */

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
  rawText?: string;
  isHtmlResponse?: boolean;
  errorMessage?: string;
}

export class ApiConnectionError extends Error {
  public status: number;
  public isHtmlResponse: boolean;
  public targetUrl: string;
  public rawSnippet: string;

  constructor(message: string, status: number, isHtmlResponse: boolean, targetUrl: string, rawSnippet: string) {
    super(message);
    this.name = 'ApiConnectionError';
    this.status = status;
    this.isHtmlResponse = isHtmlResponse;
    this.targetUrl = targetUrl;
    this.rawSnippet = rawSnippet;
  }
}

/**
 * Returns the resolved API Base URL.
 * Priority:
 * 1. window.__WAQAS_API_URL__ (runtime injected by hosting)
 * 2. localStorage 'waqas_mart_server_url' or 'waqas_pos_api_url' (user/admin configured)
 * 3. Vite build-time env VITE_API_BASE_URL / VITE_API_URL / VITE_SERVER_URL
 * 4. Default: '' (relative path for same-domain deployments with reverse proxy)
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // 1. Runtime window injection
    const winUrl = (window as any).__WAQAS_API_URL__;
    if (winUrl && typeof winUrl === 'string' && winUrl.trim()) {
      return winUrl.trim().replace(/\/+$/, '');
    }

    // 2. Local storage override
    try {
      const stored =
        localStorage.getItem('waqas_mart_server_url') ||
        localStorage.getItem('waqas_pos_api_url');
      if (stored && typeof stored === 'string') {
        const trimmed = stored.trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          return trimmed.replace(/\/+$/, '');
        }
      }
    } catch {}
  }

  // 3. Vite environment variable
  try {
    const metaEnv = (import.meta as any).env;
    const envUrl =
      metaEnv?.VITE_API_BASE_URL ||
      metaEnv?.VITE_API_URL ||
      metaEnv?.VITE_SERVER_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim() && !envUrl.includes('undefined')) {
      return envUrl.trim().replace(/\/+$/, '');
    }
  } catch {}

  // 4. Default relative
  return '';
}

/**
 * Set custom server URL persistently in browser
 */
export function setCustomApiBaseUrl(url: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!url || !url.trim()) {
      localStorage.removeItem('waqas_mart_server_url');
      localStorage.removeItem('waqas_pos_api_url');
    } else {
      let clean = url.trim().replace(/\/+$/, '');
      if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
        // default to http if just host:port or https for secure domains
        if (clean.includes('localhost') || clean.match(/^\d+\.\d+\.\d+\.\d+/)) {
          clean = `http://${clean}`;
        } else {
          clean = `https://${clean}`;
        }
      }
      localStorage.setItem('waqas_mart_server_url', clean);
      localStorage.setItem('waqas_pos_api_url', clean);
    }
    window.dispatchEvent(new CustomEvent('waqas_server_url_changed', { detail: { url } }));
  } catch (err) {
    console.error('Error saving server URL to localStorage:', err);
  }
}

/**
 * Test connectivity to backend server
 */
export async function testServerConnection(customUrl?: string): Promise<{
  ok: boolean;
  status: number;
  message: string;
  data?: any;
}> {
  const base = customUrl !== undefined ? customUrl.trim().replace(/\/+$/, '') : getApiBaseUrl();
  const targetUrl = `${base}/api/health`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    const rawText = await res.text();

    if (!contentType.includes('application/json') && (rawText.trim().startsWith('<') || rawText.includes('The page'))) {
      return {
        ok: false,
        status: res.status,
        message: `Server at '${base || 'same-domain'}' returned HTML instead of JSON (${res.status} - ${res.statusText || 'Not Found'}). The Node.js backend server might not be running on this port, or reverse proxy is missing.`,
      };
    }

    try {
      const data = JSON.parse(rawText);
      if (res.ok && (data.status === 'healthy' || data.app || data.success)) {
        return {
          ok: true,
          status: res.status,
          message: `Connected successfully! ${data.app || 'WAQAS POS Server'} is online.`,
          data,
        };
      }
      return {
        ok: false,
        status: res.status,
        message: data.message || `Server responded with status ${res.status}`,
        data,
      };
    } catch {
      return {
        ok: false,
        status: res.status,
        message: `Invalid server response format (${res.status}). Expected JSON.`,
      };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return {
        ok: false,
        status: 0,
        message: `Connection timed out after 7 seconds. Ensure backend server is reachable at '${base}'.`,
      };
    }
    return {
      ok: false,
      status: 0,
      message: `Network error: ${err.message || 'Failed to reach server'}. Check internet connection or CORS settings.`,
    };
  }
}

/**
 * Safe fetch wrapper that guarantees:
 * - Proper API URL resolution
 * - Content-Type validation
 * - Safe JSON parsing (Never throws raw 'Unexpected token T')
 * - Descriptive, human-readable error messages for web hosting / 404 / 502 / HTML issues
 */
export async function safeFetchJson<T = any>(
  endpoint: string,
  options: RequestInit = {},
  customBaseUrl?: string
): Promise<ApiResponse<T>> {
  const base = customBaseUrl !== undefined ? customBaseUrl.trim().replace(/\/+$/, '') : getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${base}${cleanEndpoint}`;

  // Session Token handling
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      const savedAuth = localStorage.getItem('waqas_mart_auth_session');
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        if (parsed?.token) token = parsed.token;
      }
      if (!token) {
        token = localStorage.getItem('waqas_mart_session_token');
      }
    } catch {}
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token && !headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutMs = 15000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(fullUrl, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
  } catch (netErr: any) {
    clearTimeout(timeoutId);
    const isTimeout = netErr.name === 'AbortError';
    const msg = isTimeout
      ? `Request to '${fullUrl}' timed out after ${timeoutMs / 1000}s. Please check backend server status.`
      : `Cannot connect to server at '${fullUrl}'. Please verify backend server is running and internet/CORS is allowed.`;
    throw new ApiConnectionError(msg, 0, false, fullUrl, '');
  }

  clearTimeout(timeoutId);

  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  const rawText = await res.text();

  // Check if response is HTML or plain text error page (e.g. Apache/Nginx/IIS 404/502 "The page cannot be found...")
  const isHtml =
    contentType.includes('text/html') ||
    rawText.trim().startsWith('<!DOCTYPE') ||
    rawText.trim().startsWith('<html') ||
    rawText.trim().startsWith('<head') ||
    rawText.trim().startsWith('<body') ||
    rawText.includes('The page cannot be found') ||
    rawText.includes('The page could not be found') ||
    rawText.includes('404 Not Found') ||
    rawText.includes('502 Bad Gateway') ||
    rawText.includes('503 Service Unavailable');

  if (isHtml) {
    const snippet = rawText.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim().slice(0, 140);
    const errorMsg =
      `Server connection error (HTTP ${res.status}): The server at '${fullUrl}' returned a web page instead of JSON API response ("${snippet}"). ` +
      `This happens when the Node.js backend server is not running on this domain, or the web hosting (Apache/Nginx/cPanel/Vercel) lacks a reverse proxy to forward /api/* to Node.js. ` +
      `Please ensure 'npm start' is running on your server, or configure your Backend Server URL.`;

    throw new ApiConnectionError(errorMsg, res.status, true, fullUrl, snippet);
  }

  // Attempt JSON parsing
  let data: any;
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch (jsonErr) {
    const snippet = rawText.replace(/\s+/g, ' ').trim().slice(0, 100);
    const errorMsg = `Invalid JSON response from server (HTTP ${res.status}): "${snippet}"`;
    throw new ApiConnectionError(errorMsg, res.status, false, fullUrl, snippet);
  }

  // If server returned an application-level failure (e.g. { success: false, message: "..." })
  if (!res.ok) {
    const msg = data?.message || data?.error || `Request failed with HTTP status ${res.status}`;
    const err = new ApiConnectionError(msg, res.status, false, fullUrl, rawText);
    (err as any).data = data;
    throw err;
  }

  return {
    ok: res.ok,
    status: res.status,
    data: data as T,
    rawText,
    isHtmlResponse: false,
  };
}
