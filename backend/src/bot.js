import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getConfig() {
  return {
    token: process.env.BOT_TOKEN || '',
    chatId: process.env.CHAT_ID || '',
    password: process.env.ADMIN_PASSWORD || 'admin',
  };
}

function bot(method, params = {}) {
  const { token } = getConfig();
  return axios.post(`https://api.telegram.org/bot${token}/${method}`, params);
}

const DB_PATH = path.join(__dirname, '../../data.json');

function readDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch {
    return { files: [] };
  }
}

function writeDb(data) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export function verifyPassword(password) {
  return password === getConfig().password;
}

export function isConfigured() {
  const { token, chatId } = getConfig();
  return !!(token && chatId);
}

export async function sendFile(buffer, fileName, mimeType) {
  const { token, chatId } = getConfig();
  const filePath = path.join(__dirname, '../../tmp', fileName);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);

  try {
    const form = new (await import('form-data')).default();
    form.append('chat_id', chatId);
    form.append('document', fs.createReadStream(filePath), fileName);

    const res = await axios.post(`https://api.telegram.org/bot${token}/sendDocument`, form, {
      headers: form.getHeaders(),
    });

    const msg = res.data.result;
    const doc = msg.document;
    const fileId = doc.file_id;
    const fileSize = doc.file_size;
    const fileUniqueId = doc.file_unique_id;

    const db = readDb();
    const entry = {
      id: fileUniqueId,
      fileId,
      messageId: msg.message_id,
      name: fileName,
      size: fileSize,
      mimeType: mimeType || doc.mime_type || 'application/octet-stream',
      date: new Date().toISOString(),
      caption: msg.caption || '',
    };
    db.files.push(entry);
    writeDb(db);

    return entry;
  } finally {
    try { fs.unlinkSync(filePath); } catch {}
  }
}

export async function getFileStream(fileId) {
  const { token } = getConfig();

  const fileRes = await bot('getFile', { file_id: fileId });
  const filePath = fileRes.data.result.file_path;
  const url = `https://api.telegram.org/file/bot${token}/${filePath}`;

  const response = await axios({ url, method: 'GET', responseType: 'stream' });
  return response.data;
}

export function listFiles() {
  const db = readDb();
  return db.files.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function deleteFile(fileId) {
  const db = readDb();
  const idx = db.files.findIndex(f => f.id === fileId);
  if (idx === -1) throw new Error('File not found');

  const entry = db.files[idx];

  try {
    const { token, chatId } = getConfig();
    await bot('deleteMessage', { chat_id: chatId, message_id: entry.messageId });
  } catch (e) {
    // message might already be deleted
  }

  db.files.splice(idx, 1);
  writeDb(db);
  return { success: true };
}

export function getFileInfo(fileId) {
  const db = readDb();
  const entry = db.files.find(f => f.id === fileId);
  if (!entry) throw new Error('File not found');
  return entry;
}
