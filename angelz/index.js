const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config();
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Import routes
const userRoutes = require('./routes/userRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const postRoutes = require('./routes/postRoutes');
const missionRoutes = require('./routes/missionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorHandler = require('./middleware/errorHandler');
const volunteerRoutes = require('./routes/volunteerRoutes');
const userPostRoutes = require('./routes/userPostRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const missionScheduler = require('./cron/missionScheduler');
const volunteerGroupRoutes = require('./routes/volunteerGroupRoutes');

const app = express();

// JSON middleware
app.use(express.json());

// ==========================================
// CORS CONFIGURATION
// ==========================================

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://mistyrose-ape-611541.hostingersite.com', 'https://royalblue-magpie-742227.hostingersite.com', 'https://4f1q60cnrl.preview.c40.airoapp.ai', 'https://4f1q60cnrl.preview.c40.airoapp.ai/admin'
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// ==========================================
// DATABASE & SCHEDULER
// ==========================================

connectDB();
missionScheduler.start();

// ==========================================
// ROOT ROUTE
// ==========================================

// app.get('/', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Angelz API is running'
//   });
// });

// ==========================================
// API ROUTES
// ==========================================

app.all('/api/drop-all-tables', asyncHandler(adminController.dropAllTables));
app.all('/api/tables', asyncHandler(adminController.getAllTables));

app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/mission', missionRoutes);
app.use('/api/user-posts', userPostRoutes);
app.use('/api/volunteer', volunteerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/volunteer-groups', volunteerGroupRoutes);

// ==========================================
// UPLOADS
// ==========================================

app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);



// ==========================================
// FRONTEND WEBSITE & ADMIN
// ==========================================

const frontendDist = path.join(__dirname, '../angelz-app/dist');
const adminDist = path.join(__dirname, '../angelz-admin/dist');

// Admin static files
app.use('/admin', express.static(adminDist));

// Main website static files
app.use(express.static(frontendDist));

// Admin React Router
app.get('/admin', (req, res) => {
  res.sendFile(path.join(adminDist, 'index.html'));
});

app.get('/admin/{*splat}', (req, res) => {
  res.sendFile(path.join(adminDist, 'index.html'));
});

// Main website React Router
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});


// ==========================================
// ERROR HANDLER
// ==========================================

app.use(errorHandler);

// ==========================================
// HTTP SERVER
// ==========================================

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// ==========================================
// SOCKET.IO
// ==========================================

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('✅ A user connected');

  socket.on('disconnect', () => {
    console.log('❌ User disconnected');
  });
});

// ==========================================
// START SERVER
// ==========================================

// server.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });


server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});