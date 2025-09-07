 import jwt from 'jsonwebtoken';

export function auth(req, res, next) {
  // Read token from httpOnly cookie
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ msg: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ msg: 'Invalid token' });
  }
}

export function admin(req, res, next) {
  if (!req.user?.isAdmin) return res.status(403).json({ msg: 'Admins only' });
  next();
}
