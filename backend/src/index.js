import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import fileRoutes from './routes/files.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

app.use('/uploads', express.static(path.join(__dirname, '../downloads')));

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
