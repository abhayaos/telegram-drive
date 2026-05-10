import { isAuthorized } from '../telegram.js';

export default async function authMiddleware(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }

  try {
    const authorized = await isAuthorized(userId);
    if (!authorized) {
      return res.status(401).json({ error: 'Not authorized' });
    }
    req.userId = userId;
    next();
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}
