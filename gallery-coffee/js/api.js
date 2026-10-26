
const API_BASE = (
  window.GALLERY_API_URL ||
  'https://gallery-coffee.onrender.com'
).replace(/\/$/, '') + '/api';

async function apiRequest(path, options = {}) {
  const token = sessionStorage.getItem('gc_token');

  const response = await fetch(API_BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Erro na API');
  }

  return data;
}
