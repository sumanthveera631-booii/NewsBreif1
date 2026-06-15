const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
};

const ensureAdmin = (req, res, next) => {
  if (req.isAuthenticated()) {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    if (req.user.email === adminEmail) {
      return next();
    }
    return res.status(403).json({ error: 'Forbidden. Admin access required.' });
  }
  res.status(401).json({ error: 'Unauthorized' });
};

module.exports = {
  ensureAuthenticated,
  ensureAdmin
};
