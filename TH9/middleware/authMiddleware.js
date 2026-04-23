function authMiddleware(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }

  return res.status(401).json({
    message: 'Bạn chưa đăng nhập'
  });
}

module.exports = authMiddleware;