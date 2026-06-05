import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError')
      return res.status(401).json({ success: false, error: { code: 'TOKEN_EXPIRED' } });
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });
  }
};
