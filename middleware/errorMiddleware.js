const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  console.error("🔥 Lỗi:", err.message); 

  res.status(statusCode).json({
    message: err.message || "Lỗi Server nội bộ",
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { errorHandler };