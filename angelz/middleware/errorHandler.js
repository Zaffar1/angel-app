const AppError = require('../utils/AppError');

module.exports = (err, req, res, next) => {
  console.error(err);

  if (res.headersSent) return next(err);

  // Handle AppError (clean expected errors)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ 
      success: false,
      message: err.message 
    });
  }

  // Handle validation errors (if using MySQL you can remove mongoose-specific part)
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, errors: messages });
  }

  // Fallback for unhandled errors
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};
