// Typed API client wrapper
export async function apiRequest(method: string, path: string, body?: any, options: RequestInit = {}) {
  const headers: Record<string, string> = { 'Accept': 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(path, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let parsed;
    try { parsed = text ? JSON.parse(text) : null; } catch { parsed = null; }
    const message = parsed?.message || res.statusText || 'API request failed';
    const error: any = new Error(message);
    error.status = res.status;
    error.body = parsed || text;
    throw error;
  }

  // Try parse json, but return null if no content
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return res.json();
  return null;
}

export async function getPortfolio() {
  return apiRequest('GET', '/api/portfolio');
}

export async function generatePortfolio() {
  return apiRequest('POST', '/api/portfolio/generate');
}

export async function getAssessment() {
  return apiRequest('GET', '/api/risk-assessment');
}

export async function getEtfInfo(ticker: string) {
  return apiRequest('GET', `/api/etf/${encodeURIComponent(ticker)}/info`);
}

export async function getEtfHistory(ticker: string, range = '1y', interval = '1wk') {
  return apiRequest('GET', `/api/etf/${encodeURIComponent(ticker)}/history?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`);
}
