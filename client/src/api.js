async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || `Error ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const api = {
  getUsers: () => request('/api/users'),
  createUser: (user) => request('/api/users', { method: 'POST', body: user }),
  updateUser: (id, changes) => request(`/api/users/${id}`, { method: 'PUT', body: changes }),
  deleteUser: (id) => request(`/api/users/${id}`, { method: 'DELETE' }),
  getEntries: () => request('/api/entries'),
  saveEntry: (entry) => request('/api/entries', { method: 'POST', body: entry }),
  deleteEntry: (id) => request(`/api/entries/${id}`, { method: 'DELETE' }),
  getHolidays: () => request('/api/holidays'),
  createHoliday: (holiday) => request('/api/holidays', { method: 'POST', body: holiday }),
  deleteHoliday: (id) => request(`/api/holidays/${id}`, { method: 'DELETE' }),
};
