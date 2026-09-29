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
const missionScheduler = require("./cron/missionScheduler");
const volunteerGroupRoutes = require('./routes/volunteerGroupRoutes');

const app = express();
app.use(express.json());

// ✅ Allowed origins for both API & Socket.io
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000','https://splitarts.net','https://splitarts.net/angelz', 'https://splitarts.net/angel-website'
];

// ✅ CORS middleware for Express
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Handle preflight for all routes
app.options(/.*/, cors()); // regex that matches all routes safely

// ✅ Connect to DB
connectDB();
missionScheduler.start();
const base = '/angelz';
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Angelz API is running'
  });
});


// Routes
// app.use(`${base}/api`, adminRoutes);
app.use(`${base}/api/admin`, adminRoutes);
app.use(`${base}/api/users`, userRoutes);
app.use(`${base}/api/organization`, organizationRoutes);
app.use(`${base}/api/posts`, postRoutes);
app.use(`${base}/api/mission`, missionRoutes);
app.use(`${base}/api/user-posts`, userPostRoutes);
app.use(`${base}/api/volunteer`, volunteerRoutes);
app.use(`${base}/api/notifications`, notificationRoutes);
app.use(`${base}/uploads`, express.static(path.join(__dirname, 'uploads')));
app.use(`${base}/api/volunteer-groups`, volunteerGroupRoutes);

// Error handler middleware
app.use(errorHandler);

// ✅ Create HTTP server
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// ✅ Socket.io setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('✅ A user connected');

  socket.on('disconnect', () => {
    console.log('❌ User disconnected');
  });
});

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
 
 




// const express = require('express');
// const connectDB = require('./config/db');
// require('dotenv').config();
// const userRoutes = require('./routes/userRoutes');
// const organizationRoutes = require('./routes/organizationRoutes');
// const path = require('path');
// const postRoutes = require('./routes/postRoutes');
// const missionRoutes = require('./routes/missionRoutes');
// const errorHandler = require('./middleware/errorHandler');
// const adminRoutes = require('./routes/adminRoutes');
// const volunteerRoutes = require('./routes/volunteerRoutes');
// const http = require('http');
// const { Server } = require('socket.io');

// const app = express();
// app.use(express.json());

// connectDB();

// // const base = '/Angelz';
// // // Routes
// // app.use(`${base}/api/admin`, adminRoutes);
// // app.use(`${base}/api/users`, userRoutes);
// // app.use(`${base}/api/organization`, organizationRoutes);
// // app.use(`${base}/api/posts`, postRoutes);
// // app.use(`${base}/api/mission`, missionRoutes);

// // app.use(`${base}/uploads`, express.static(path.join(__dirname, 'uploads')));


// // Routes
// app.use('/api/admin', adminRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/organization', organizationRoutes);
// app.use('/api/posts', postRoutes);
// app.use('/api/mission', missionRoutes);

// app.use('/api/volunteer', volunteerRoutes);

// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// app.use(errorHandler);

// const PORT = process.env.PORT || 5000;

// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: "*", // <-- replace with frontend URL in production
//   }
// });

// io.on("connection", (socket) => {
//   console.log("a user connected");

//   socket.on("disconnect", () => {
//     console.log("user disconnected");
//   });
// });

// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
