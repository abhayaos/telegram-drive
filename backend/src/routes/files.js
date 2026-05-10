import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { sendFile, getFileStream, listFiles, deleteFile, getFileInfo } from '../bot.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP = path.join(__dirname, '../../tmp');
fs.mkdirSync(TMP, { recursive: true });

const upload = multer({ dest: TMP });
const router = Router();

const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

function requireAuth(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (AUTH_TOKEN && token !== AUTH_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.use(requireAuth);

router.get('/', (req, res) => {
  try {
    const files = listFiles();
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file' });

    const buffer = fs.readFileSync(file.path);
    const result = await sendFile(buffer, file.originalname, file.mimetype);
    fs.unlinkSync(file.path);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/download/:id', async (req, res) => {
  try {
    const info = getFileInfo(req.params.id);
    const stream = await getFileStream(info.fileId);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(info.name)}"`);
    stream.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/preview/:id', async (req, res) => {
  try {
    const info = getFileInfo(req.params.id);
    if (!info.mimeType?.startsWith('image/') && !info.mimeType?.startsWith('video/')) {
      return res.status(400).json({ error: 'Not previewable' });
    }
    const stream = await getFileStream(info.fileId);
    res.setHeader('Content-Type', info.mimeType);
    stream.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await deleteFile(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const info = getFileInfo(req.params.id);
    res.json(info);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
