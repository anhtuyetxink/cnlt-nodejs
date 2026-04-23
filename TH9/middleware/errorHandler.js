function errorHandler(err, req, res, next) {
  console.error('Lỗi hệ thống:', err);

  return res.status(err.status || 500).json({
    message: err.message || 'Lỗi server'
  });
}

module.exports = errorHandler;