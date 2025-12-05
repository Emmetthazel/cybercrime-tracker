const mongoose = require('mongoose');

// Track if we've set up event listeners
let eventListenersSetup = false;

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cybercrime_tracker';
    
    // Mongoose 7.x - removed deprecated options
    const options = {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      heartbeatFrequencyMS: 10000, // Send heartbeat every 10s to keep connection alive
    };

    // Check if already connected and actually ready
    if (mongoose.connection.readyState === 1) {
      // Verify it's actually connected by checking host
      if (mongoose.connection.host) {
        console.log('MongoDB already connected');
        return mongoose.connection;
      }
    }
    
    // If state is 0 (disconnected), we need to reconnect
    if (mongoose.connection.readyState === 0) {
      console.log('MongoDB is disconnected, reconnecting...');
      // Close any existing connection first
      try {
        await mongoose.connection.close();
      } catch (e) {
        // Ignore errors if already closed
      }
    }

    // Set up event listeners once
    if (!eventListenersSetup) {
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err.message);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnected. State:', mongoose.connection.readyState);
        console.warn('   Mongoose will attempt to reconnect automatically...');
      });

      mongoose.connection.on('connected', () => {
        console.log('✅ MongoDB connection established and ready');
        console.log('   State:', mongoose.connection.readyState, '(1=connected)');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected successfully');
      });
      
      eventListenersSetup = true;
    }

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoURI, options);
    
    // Get the connection object
    const connection = mongoose.connection;
    
    // Wait for connection to be fully ready
    // The connect() promise resolves when connection is established
    let attempts = 0;
    while (connection.readyState !== 1 && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      attempts++;
    }
    
    // Log connection info
    const finalState = connection.readyState;
    console.log(`✅ MongoDB Connection:`);
    console.log(`   Host: ${connection.host || 'N/A'}`);
    console.log(`   Database: ${connection.name || 'N/A'}`);
    console.log(`   State: ${finalState} ${finalState === 1 ? '(Connected ✅)' : '(Not Connected)'}`);
    console.log(`   Connection ID: ${connection.id}`);
    
    if (finalState !== 1) {
      console.warn('⚠️  Connection state is not 1, but Mongoose will handle reconnection');
    }
    
    // Return the connection object
    return connection;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    console.error('Please ensure MongoDB is running on localhost:27017');
    console.error('Or check your MONGODB_URI in .env file');
    process.exit(1);
  }
};

module.exports = connectDB;
