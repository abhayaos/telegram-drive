import { Router } from 'express';
import { isConfigured, verifyPassword } from '../bot.js';

const router = Router();

router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!isConfigured()) {
    return res.status(400).json({ error: 'BOT_TOKEN and CHAT_ID not configured. Set them in environment variables.' });
  }
  if (!verifyPassword(password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  const token = 'session-' + Buffer.from(Date.now().toString()).toString('hex');
  res.json({ success: true, token });
});

router.get('/status', (req, res) => {
  res.json({ configured: isConfigured() });
});

export default router;
