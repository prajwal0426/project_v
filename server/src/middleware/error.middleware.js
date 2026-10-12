export function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

export function errorHandler(error, _req, res, _next) {
  const duplicateKey = error?.code === 11000;
  const malformedId = error?.name === 'CastError';
  const status = error.status || (duplicateKey ? 409 : malformedId ? 400 : 500);
  res.status(status).json({
    message: duplicateKey ? 'A record with that value already exists' : malformedId ? 'Invalid identifier' : error.message || 'Server error',
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
  });
}
