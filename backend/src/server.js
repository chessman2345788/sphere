require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initializeSocket } = require('./config/socket');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Database
connectDB().then(() => {
  // Create HTTP Server
  const server = http.createServer(app);

  // Initialize Socket.io
  initializeSocket(server);

  // Start Server
  server.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}).catch(err => {
  console.error('Database connection failed, server cannot start:', err.message);
  process.exit(1);
});
