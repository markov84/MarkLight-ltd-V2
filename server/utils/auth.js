import jwt from 'jsonwebtoken';

/**
 * Reads JWT from httpOnly cookie "token" and attaches payload to req.user
 */
export function auth(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ msg: 'Not authenticated' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Invalid/expired token' });
  }
}

/**
 * Requires authenticated user with isAdmin === true
 */
export function admin(req, res, next) {
  if (!req.user) return res.status(401).json({ msg: 'Not authenticated' });
  if (!req.user.isAdmin) return res.status(403).json({ msg: 'Admin only' });
  next();
}
