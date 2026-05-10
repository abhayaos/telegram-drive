import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authMiddleware from '../middleware/auth.js';
import {
  listFiles,
  uploadFile,
  downloadFile,
  deleteFile,
  getFileInfo,
} from '../telegram.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP_DIR = path.join(__dirname, '../../tmp');

if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

const upload = multer({ dest: TMP_DIR });
const router = Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const folder = req.query.folder || '/';
    const files = await listFiles(req.userId, folder);
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const fileFolder = req.body.folder || '/';
    if (!file) return res.status(400).json({ error: 'No file provided' });

    const buffer = fs.readFileSync(file.path);
    const result = await uploadFile(req.userId, file.path, buffer, file.originalname, fileFolder);
    fs.unlinkSync(file.path);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/download/:id', async (req, res) => {
  try {
    const info = await getFileInfo(req.userId, req.params.id);
    const result = await downloadFile(req.userId, req.params.id);
    res.download(result.path, result.fileName, () => {
      fs.unlinkSync(result.path);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await deleteFile(req.userId, req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const info = await getFileInfo(req.userId, req.params.id);
    res.json(info);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
