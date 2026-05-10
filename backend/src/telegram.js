import { TelegramClient } from 'gramjs';
import { StringSession } from 'gramjs/sessions/index.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SESSION_DIR = path.join(__dirname, '../sessions');
const DOWNLOAD_DIR = path.join(__dirname, '../downloads');

if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

const API_ID = parseInt(process.env.API_ID) || 0;
const API_HASH = process.env.API_HASH || '';

const clients = new Map();

function getSessionPath(userId) {
  return path.join(SESSION_DIR, `${userId}.session`);
}

function loadSession(userId) {
  const sessionPath = getSessionPath(userId);
  if (fs.existsSync(sessionPath)) {
    return fs.readFileSync(sessionPath, 'utf-8');
  }
  return '';
}

function saveSession(userId, sessionString) {
  fs.writeFileSync(getSessionPath(userId), sessionString, 'utf-8');
}

export async function getClient(userId) {
  if (clients.has(userId)) {
    return clients.get(userId);
  }
  return null;
}

export async function createClient(userId, sessionString = '') {
  const client = new TelegramClient(
    new StringSession(sessionString),
    API_ID,
    API_HASH,
    { connectionRetries: 5 }
  );
  clients.set(userId, client);
  return client;
}

export async function connectClient(userId) {
  const client = await getClient(userId);
  if (!client) return null;
  await client.connect();
  return client;
}

export async function isAuthorized(userId) {
  const client = await getClient(userId);
  if (!client) return false;
  try {
    await client.connect();
    return await client.isUserAuthorized();
  } catch {
    return false;
  }
}

export function persistClient(userId) {
  const client = clients.get(userId);
  if (client) {
    saveSession(userId, client.session.save());
  }
}

export async function sendCode(userId, phoneNumber) {
  const client = await createClient(userId);
  await client.connect();
  const result = await client.sendCode(
    { apiId: API_ID, apiHash: API_HASH },
    phoneNumber
  );
  persistClient(userId);
  return result;
}

export async function signIn(userId, phoneNumber, code, phoneCodeHash) {
  const client = await getClient(userId);
  if (!client) throw new Error('Client not initialized');
  await client.invoke(
    new (await import('gramjs/api.js')).Api.auth.SignIn({
      phoneNumber,
      phoneCodeHash,
      phoneCode: code,
    })
  );
  persistClient(userId);
  return true;
}

export async function signInWithPassword(userId, password) {
  const client = await getClient(userId);
  if (!client) throw new Error('Client not initialized');
  await client.signInWithPassword(
    { apiId: API_ID, apiHash: API_HASH },
    { password }
  );
  persistClient(userId);
  return true;
}

export async function getMe(userId) {
  const client = await getClient(userId);
  if (!client) throw new Error('Client not initialized');
  return await client.getMe();
}

import { Api } from 'gramjs/api.js';

export async function listFiles(userId, folder = '/') {
  const client = await getClient(userId);
  if (!client) throw new Error('Client not initialized');

  const me = await client.getMe();
  const result = await client.invoke(
    new Api.messages.Search({
      peer: 'me',
      q: '',
      filter: new Api.InputMessagesFilterDocument(),
      minDate: 0,
      maxDate: 0,
      offsetId: 0,
      addOffset: 0,
      limit: 100,
      maxId: 0,
      minId: 0,
      hash: 0n,
    })
  );

  const files = [];
  for (const msg of result.messages) {
    if (msg._ === 'Message' && msg.media?._ === 'MessageMediaDocument') {
      const doc = msg.media.document;
      const caption = msg.message || '';
      let filePath = caption.split('\n')[0] || doc.attributes?.find(a => a._ === 'DocumentAttributeFilename')?.fileName || 'unknown';
      const fileFolder = filePath.includes('/') ? '/' + filePath.split('/').slice(0, -1).join('/') : '/';
      const fileName = filePath.split('/').pop();
      const size = doc.size || 0;
      const mimeType = doc.mimeType || 'application/octet-stream';
      const date = new Date(msg.date * 1000).toISOString();

      if (folder === '/' || fileFolder === folder) {
        files.push({
          id: msg.id.toString(),
          name: fileName,
          path: filePath,
          folder: fileFolder,
          size,
          mimeType,
          date,
          thumbnail: doc.thumbs?.length ? true : false,
        });
      }
    }
  }

  return files;
}

export async function uploadFile(userId, filePath, fileBuffer, fileName, fileFolder = '/') {
  const client = await getClient(userId);
  if (!client) throw new Error('Client not initialized');

  const fullPath = fileFolder === '/' ? fileName : `${fileFolder.replace(/\/$/, '')}/${fileName}`;

  const file = await client.uploadFile({
    file: new (await import('gramjs')).CustomFile(fileName, fileBuffer.length, fileBuffer),
    workers: 1,
  });

  const me = await client.getMe();
  const result = await client.invoke(
    new Api.messages.SendMedia({
      peer: 'me',
      media: new Api.InputMediaUploadedDocument({
        file,
        attributes: [
          new Api.DocumentAttributeFilename({ fileName }),
        ],
        mimeType: 'application/octet-stream',
      }),
      message: fullPath,
      randomId: BigInt(Date.now()),
    })
  );

  return { success: true, id: result.updates[0]?.id?.toString() };
}

export async function downloadFile(userId, messageId) {
  const client = await getClient(userId);
  if (!client) throw new Error('Client not initialized');

  const me = await client.getMe();
  const messages = await client.invoke(
    new Api.messages.GetMessages({
      peer: 'me',
      id: [parseInt(messageId)],
    })
  );

  const msg = messages.messages[0];
  if (!msg?.media?._ === 'MessageMediaDocument') throw new Error('Not a file');

  const doc = msg.media.document;
  const fileName = doc.attributes?.find(a => a._ === 'DocumentAttributeFilename')?.fileName || 'download';
  const destPath = path.join(DOWNLOAD_DIR, fileName);

  const buffer = await client.downloadMedia(msg, {});
  fs.writeFileSync(destPath, buffer);

  return { path: destPath, fileName, buffer };
}

export async function deleteFile(userId, messageId) {
  const client = await getClient(userId);
  if (!client) throw new Error('Client not initialized');

  await client.invoke(
    new Api.messages.DeleteMessages({
      peer: 'me',
      id: [parseInt(messageId)],
    })
  );

  return { success: true };
}

export async function getFileInfo(userId, messageId) {
  const client = await getClient(userId);
  if (!client) throw new Error('Client not initialized');

  const messages = await client.invoke(
    new Api.messages.GetMessages({
      peer: 'me',
      id: [parseInt(messageId)],
    })
  );

  const msg = messages.messages[0];
  if (!msg || msg._ !== 'Message') throw new Error('Message not found');
  if (msg.media?._ !== 'MessageMediaDocument') throw new Error('Not a file');

  const doc = msg.media.document;
  const caption = msg.message || '';
  const fileName = doc.attributes?.find(a => a._ === 'DocumentAttributeFilename')?.fileName || 'unknown';
  const filePath = caption.split('\n')[0] || fileName;
  const fileFolder = filePath.includes('/') ? '/' + filePath.split('/').slice(0, -1).join('/') : '/';

  return {
    id: msg.id.toString(),
    name: fileName,
    path: filePath,
    folder: fileFolder,
    size: doc.size || 0,
    mimeType: doc.mimeType || 'application/octet-stream',
    date: new Date(msg.date * 1000).toISOString(),
  };
}

export function logout(userId) {
  clients.delete(userId);
  const sessionPath = getSessionPath(userId);
  if (fs.existsSync(sessionPath)) fs.unlinkSync(sessionPath);
}
