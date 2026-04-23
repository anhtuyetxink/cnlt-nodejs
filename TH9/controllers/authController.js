function login(req, res) {
  const { username, password } = req.body;

  if (username === 'admin' && password === '123456') {
    req.session.user = {
      username: 'admin',
      role: 'admin',
      loginTime: new Date().toISOString()
    };

    return res.json({
      message: 'Đăng nhập thành công',
      user: req.session.user
    });
  }

  return res.status(401).json({
    message: 'Sai tài khoản hoặc mật khẩu'
  });
}

function logout(req, res, next) {
  if (!req.session) {
    return res.json({
      message: 'Đăng xuất thành công'
    });
  }

  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }

    res.clearCookie('connect.sid');

    return res.json({
      message: 'Đăng xuất thành công'
    });
  });
}

module.exports = {
  login,
  logout
};