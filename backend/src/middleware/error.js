
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  
  console.error('🔥 Server Error: ', err);

  
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new Error(message);
    error.statusCode = 404;
  }

  
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value entered: ${field}. Please use another value.`;
    error = new Error(message);
    error.statusCode = 400;
  }

  
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new Error(message);
    error.statusCode = 400;
  }

  
  const statusCode = error.statusCode || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;
