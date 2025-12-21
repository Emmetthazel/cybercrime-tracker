const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('../Configuration/config/db');
const { connectNeo4j } = require('../Configuration/config/neo4j');
const config = require('../Configuration/config/config');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const attacksRoutes = require('./routes/attacks');
const ipsRoutes = require('./routes/ips');
const usersRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const sourcesRoutes = require('./routes/sources');
const reportsRoutes = require('./routes/reports');
const alertsRoutes = require('./routes/alerts');
const graphRoutes = require('./routes/graph');
const searchRoutes = require('./routes/search');

// Initialize Express app
const app = express();

// Configure Mongoose before connecting
const mongoose = require('mongoose');
// Increase buffer timeout to 30 seconds (default is 10s)
mongoose.set('bufferTimeoutMS', 30000);

// Connect to database before starting server
let serverStarted = false;

const startServer = async () => {
  try {
    // Connect to MongoDB first
    const connection = await connectDB();
    
    // Connect to Neo4j (optional - app can run without it)
    let neo4jConnected = false;
    try {
      await connectNeo4j();
      neo4jConnected = true;
      console.log('✅ Neo4j connection established');
    } catch (neo4jError) {
      console.warn('⚠️  Neo4j connection failed (optional):', neo4jError.message);
      console.warn('   Graph features will be disabled. App will continue with MongoDB only.');
    }
    
    // Wait a bit and verify connection
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check connection using the returned connection object
    const readyState = connection.readyState;
    
    // Log connection info
    console.log('\n📊 Connection Status Check:');
    console.log(`   Ready State: ${readyState} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`);
    console.log(`   Connection ID: ${connection.id}`);
    console.log(`   Host: ${connection.host || 'N/A'}`);
    console.log(`   Name: ${connection.name || 'N/A'}`);
    
    if (readyState === 1) {
      console.log('✅ MongoDB connection verified and ready');
    } else {
      console.warn(`⚠️  Warning: MongoDB connection state: ${readyState}`);
      console.warn('  Server will start anyway');
      console.warn('  Note: Queries may fail if connection is not established');
      console.warn('  Make sure MongoDB is running: .\\start-mongodb.ps1');
    }
    
    // Only start server after database connection attempt
    if (!serverStarted) {
      const PORT = config.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`\n✅ Server running on port ${PORT}`);
        console.log(`   Environment: ${config.NODE_ENV}`);
        console.log(`   API available at http://localhost:${PORT}/api`);
        console.log(`   MongoDB State: ${connection.readyState === 1 ? 'Connected ✅' : `State ${connection.readyState}`}`);
        console.log(`   Neo4j State: ${neo4jConnected ? 'Connected ✅' : 'Not Connected ⚠️'}`);
        serverStarted = true;
      });
    }
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/attacks', attacksRoutes);
app.use('/api/ips', ipsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sources', sourcesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/search', searchRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Cybercrime Tracker API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      attacks: '/api/attacks',
      ips: '/api/ips',
      users: '/api/users',
      dashboard: '/api/dashboard',
      sources: '/api/sources',
      reports: '/api/reports',
      alerts: '/api/alerts',
      graph: '/api/graph',
      search: '/api/search'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;

