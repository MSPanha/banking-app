const API = 'http://localhost:5000/api'

function getToken() {
  return localStorage.getItem('token')
}

function getUser() {
  const u = localStorage.getItem('user')
  return u ? JSON.parse(u) : null
}

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = 'index.html'
}

function requireAuth() {
  if (!getToken()) window.location.href = 'index.html'
}

async function apiFetch(path, options = {}) {
  const token = getToken()
  const res = await fetch(API + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Something went wrong')
  return data
}

function showAlert(id, message, type = 'error') {
  const el = document.getElementById(id)
  if (!el) return
  el.textContent = message
  el.className = `alert alert-${type} show`
  setTimeout(() => el.classList.remove('show'), 5000)
}

function formatCurrency(amount) {
  return '$' + parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId)
  if (!btn) return
  btn.disabled = loading
  btn.innerHTML = loading
    ? `<span class="loader"></span> Processing...`
    : btn.getAttribute('data-label')
}