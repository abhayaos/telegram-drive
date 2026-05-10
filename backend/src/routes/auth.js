import { Router } from 'express';
import {
  getClient,
  createClient,
  connectClient,
  sendCode,
  signIn,
  signInWithPassword,
  isAuthorized,
  getMe,
  persistClient,
  logout,
} from '../telegram.js';

const router = Router();

let codeRequests = new Map();

router.post('/send-code', async (req, res) => {
  try {
    const { phoneNumber, userId } = req.body;
    if (!phoneNumber || !userId) {
      return res.status(400).json({ error: 'Phone and userId required' });
    }

    const result = await sendCode(userId, phoneNumber);
    codeRequests.set(userId, {
      phoneCodeHash: result.phoneCodeHash,
      phoneNumber,
    });

    res.json({ success: true, phoneCodeHash: result.phoneCodeHash });
  } catch (err) {
    console.error('Send code error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/verify-code', async (req, res) => {
  try {
    const { userId, code } = req.body;
    const codeReq = codeRequests.get(userId);
    if (!codeReq) {
      return res.status(400).json({ error: 'No code request found' });
    }

    try {
      await signIn(userId, codeReq.phoneNumber, code, codeReq.phoneCodeHash);
      codeRequests.delete(userId);
      const me = await getMe(userId);
      res.json({ success: true, user: { id: me.id.toString(), username: me.username, phone: me.phone } });
    } catch (err) {
      if (err.errorMessage === 'SESSION_PASSWORD_NEEDED') {
        return res.json({ needPassword: true });
      }
      throw err;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/verify-password', async (req, res) => {
  try {
    const { userId, password } = req.body;
    await signInWithPassword(userId, password);
    const me = await getMe(userId);
    res.json({ success: true, user: { id: me.id.toString(), username: me.username, phone: me.phone } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/status', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.json({ authorized: false });
    const authorized = await isAuthorized(userId);
    if (authorized) {
      const me = await getMe(userId);
      return res.json({ authorized: true, user: { id: me.id.toString(), username: me.username, phone: me.phone } });
    }
    res.json({ authorized: false });
  } catch {
    res.json({ authorized: false });
  }
});

router.post('/logout', async (req, res) => {
  const { userId } = req.body;
  logout(userId);
  res.json({ success: true });
});

export default router;
