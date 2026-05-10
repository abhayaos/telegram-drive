import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:3001/api' });

let token = localStorage.getItem('tg_token') || '';

API.interceptors.request.use((config) => {
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function setToken(t) {
  token = t;
  localStorage.setItem('tg_token', t);
}

export function clearToken() {
  token = '';
  localStorage.removeItem('tg_token');
}

export async function login(password) {
  const { data } = await API.post('/auth/login', { password });
  if (data.success) setToken(data.token);
  return data;
}

export async function checkStatus() {
  const { data } = await API.get('/auth/status');
  return data;
}

export async function fetchFiles() {
  const { data } = await API.get('/files');
  return data.files;
}

export async function uploadFile(file) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await API.post('/files/upload', form);
  return data;
}

export async function deleteFile(id) {
  const { data } = await API.delete(`/files/${id}`);
  return data;
}

export function getDownloadUrl(id) {
  return `http://localhost:3001/api/files/download/${id}`;
}

export function getPreviewUrl(id) {
  return `http://localhost:3001/api/files/preview/${id}`;
}
