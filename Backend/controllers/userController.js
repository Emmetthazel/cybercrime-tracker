const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('../../Configuration/config/config');
const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRE
  });
};

// Generate Refresh Token
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRE
  });
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { username, email, password, full_name, role } = req.body;

    // Check if user exists - Mongoose will handle connection automatically
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = new User({
      username,
      email,
      password,
      full_name,
      role: role || 'user',
      is_verified: false
    });

    await user.save();

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refresh_tokens.push({
      token: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      device: req.headers['user-agent'],
      ip_address: req.ip
    });
    await user.save();

    // Log audit
    await AuditLog.create({
      action: 'CREATE',
      resource_type: 'User',
      resource_id: user._id,
      username: user.username,
      ip_address: req.ip,
      description: `User registered: ${username}`
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user - Mongoose will handle connection buffering automatically
    // Log connection state for debugging
    const connectionState = mongoose.connection.readyState;
    console.log(`🔐 Login attempt - MongoDB state: ${connectionState}`);
    
    // If connection is not ready, try to reconnect
    if (connectionState !== 1) {
      console.log('⚠️  Connection not ready, attempting to reconnect...');
      try {
        // If disconnected, close and reconnect
        if (connectionState === 0) {
          const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cybercrime_tracker';
          
          // Force close any existing connection
          try {
            if (mongoose.connection.readyState !== 0) {
              await mongoose.connection.close();
            }
          } catch (closeError) {
            // Ignore close errors
          }
          
          // Force reconnect by disconnecting first if needed
          if (mongoose.connection.readyState === 0) {
            // Reconnect
            await mongoose.connect(mongoURI, {
              serverSelectionTimeoutMS: 5000,
              socketTimeoutMS: 45000
            });
            
            // Wait for connection to be ready
            let attempts = 0;
            while (mongoose.connection.readyState !== 1 && attempts < 20) {
              await new Promise(resolve => setTimeout(resolve, 250));
              attempts++;
            }
            
            if (mongoose.connection.readyState === 1) {
              console.log('✅ Reconnected to MongoDB successfully');
            } else {
              throw new Error('Reconnection failed - state is still ' + mongoose.connection.readyState);
            }
          }
        }
      } catch (reconnectError) {
        console.error('❌ Reconnection failed:', reconnectError.message);
        return res.status(503).json({ 
          message: 'Database connection not available. Please ensure MongoDB is running and try again.',
          hint: 'Check if MongoDB is running: .\\start-mongodb.ps1'
        });
      }
    }
    
    let user;
    try {
      // Mongoose will automatically buffer this query if connection is not ready
      // Increased timeout to give more time
      user = await User.findOne({ email }).maxTimeMS(20000); // 20 second timeout
      
      console.log(`✅ User query completed - State: ${mongoose.connection.readyState}`);
    } catch (dbError) {
      console.error('❌ Database error during login:', dbError.message);
      console.error('   Error name:', dbError.name);
      console.error('   MongoDB readyState:', mongoose.connection.readyState);
      
      // Check if it's a connection/buffering issue
      if (dbError.name === 'MongoServerSelectionError' || 
          dbError.message.includes('buffering') ||
          dbError.message.includes('timeout')) {
        return res.status(503).json({ 
          message: 'Database connection not available. Please ensure MongoDB is running and try again.',
          hint: 'Check if MongoDB is running: .\\start-mongodb.ps1',
          state: mongoose.connection.readyState
        });
      }
      
      return res.status(503).json({ 
        message: 'Database error. Please try again in a moment.',
        error: dbError.message
      });
    }
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    // Check if account is locked
    if (user.is_locked && user.locked_until > new Date()) {
      return res.status(403).json({ message: 'Account is locked' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      user.failed_login_attempts += 1;
      user.last_failed_login = new Date();
      
      // Lock account after 5 failed attempts
      if (user.failed_login_attempts >= 5) {
        user.is_locked = true;
        user.locked_until = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }
      
      await user.save();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Reset failed attempts
    user.failed_login_attempts = 0;
    user.is_locked = false;
    user.locked_until = null;
    user.last_login = new Date();
    user.last_login_ip = req.ip;
    user.login_count += 1;

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refresh_tokens.push({
      token: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      device: req.headers['user-agent'],
      ip_address: req.ip
    });

    await user.save();

    // Log audit
    await AuditLog.create({
      action: 'LOGIN',
      resource_type: 'User',
      resource_id: user._id,
      user_id: user._id,
      username: user.username,
      ip_address: req.ip,
      description: `User logged in: ${user.username}`,
      status: 'Success'
    });

    res.json({
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -password_history -refresh_tokens -two_factor_secret');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Allow updating specific fields only
    const allowedUpdates = ['full_name', 'phone', 'office_location', 'bio', 'preferences', 'dashboard_config'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid updates' });
    }

    Object.assign(user, req.body);
    await user.save();

    // Log audit
    await AuditLog.create({
      action: 'UPDATE',
      resource_type: 'User',
      resource_id: user._id,
      user_id: user._id,
      username: user.username,
      ip_address: req.ip,
      description: 'Updated profile'
    });

    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -password_history -refresh_tokens -two_factor_secret')
      .sort({ created_at: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -password_history -refresh_tokens -two_factor_secret');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user (admin)
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    Object.assign(user, req.body);
    await user.save();

    // Log audit
    await AuditLog.create({
      action: 'UPDATE',
      resource_type: 'User',
      resource_id: user._id,
      user_id: req.user._id,
      username: req.user.username,
      ip_address: req.ip,
      description: `Updated user ${user.username}`
    });

    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log audit
    await AuditLog.create({
      action: 'DELETE',
      resource_type: 'User',
      resource_id: user._id,
      user_id: req.user._id,
      username: req.user.username,
      ip_address: req.ip,
      description: `Deleted user ${user.username}`
    });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Check if refresh token exists in user's tokens
    const tokenExists = user.refresh_tokens.some(
      token => token.token === refreshToken && token.expires_at > new Date()
    );

    if (!tokenExists) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    // Generate new tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Remove old refresh token and add new one
    user.refresh_tokens = user.refresh_tokens.filter(
      token => token.token !== refreshToken
    );
    user.refresh_tokens.push({
      token: newRefreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      device: req.headers['user-agent'],
      ip_address: req.ip
    });

    await user.save();

    res.json({
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const user = await User.findById(req.user._id);

    if (refreshToken) {
      user.refresh_tokens = user.refresh_tokens.filter(
        token => token.token !== refreshToken
      );
      await user.save();
    }

    // Log audit
    await AuditLog.create({
      action: 'LOGOUT',
      resource_type: 'User',
      resource_id: user._id,
      user_id: user._id,
      username: user.username,
      ip_address: req.ip,
      description: `User logged out: ${user.username}`
    });

    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

