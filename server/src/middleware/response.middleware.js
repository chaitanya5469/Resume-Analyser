export function responseMiddleware(_req, res, next) {
  res.success = (data, { status = 200, message = 'OK', meta } = {}) => {
    res.status(status).json({ success: true, message, data, ...(meta && { meta }) });
  };
  next();
}
