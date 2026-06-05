export const success = (res, data, statusCode = 200, meta = null) =>
  res.status(statusCode).json({ success: true, data, ...(meta && { meta }) });

export const failure = (res, code, message, statusCode = 400) =>
  res.status(statusCode).json({ success: false, error: { code, message } });
