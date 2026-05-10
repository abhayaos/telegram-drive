import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:3001/api' });

const userId = () => localStorage.getItem('tg_user_id') || '';

API.interceptors.request.use((config) => {
  const uid = userId();
  if (uid) config.headers['x-user-id'] = uid;
  return config;
});

export function setUserId(id) {
  localStorage.setItem('tg_user_id', id);
}

export function clearUserId() {
  localStorage.removeItem('tg_user_id');
}

export function getUserId() {
  return userId();
}

export async function sendCode(phoneNumber) {
  const uid = Date.now().toString();
  setUserId(uid);
  const { data } = await API.post('/auth/send-code', { phoneNumber, userId: uid });
  return data;
}

export async function verifyCode(code) {
  const { data } = await API.post('/auth/verify-code', { userId: userId(), code });
  return data;
}

export async function verifyPassword(password) {
  const { data } = await API.post('/auth/verify-password', { userId: userId(), password });
  return data;
}

export async function checkAuth() {
  const uid = userId();
  if (!uid) return { authorized: false };
  try {
    const { data } = await API.get('/auth/status');
    return data;
  } catch {
    return { authorized: false };
  }
}

export async function logout() {
  await API.post('/auth/logout', { userId: userId() });
  clearUserId();
}

export async function fetchFiles(folder = '/') {
  const { data } = await API.get('/files', { params: { folder } });
  return data.files;
}

export async function uploadFile(file, folder = '/') {
  const form = new FormData();
  form.append('file', file);
  form.append('folder', folder);
  const { data } = await API.post('/files/upload', form);
  return data;
}

export async function downloadFile(id) {
  const { data } = await API.get(`/files/download/${id}`, { responseType: 'blob' });
  return data;
}

export async function deleteFile(id) {
  const { data } = await API.delete(`/files/${id}`);
  return data;
}

export function getDownloadUrl(id) {
  return `http://localhost:3001/api/files/download/${id}`;
}
