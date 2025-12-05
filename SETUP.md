# 🚀 Quick Setup Guide

## Step-by-Step Setup

### 1. Prerequisites Check
```bash
# Check Node.js version (should be 14+)
node --version

# Check MongoDB version (should be 4.4+)
mongod --version

# Check npm
npm --version
```

### 2. Start MongoDB

**Windows:**
```powershell
# Create data directory first (run as Administrator)
mkdir C:\data\db

# Then start MongoDB
mongod

# OR use custom path
mongod --dbpath C:\mongodb-data\db
```

**Linux/Mac:**
```bash
sudo systemctl start mongod
# or
mongod
```

**Note:** If MongoDB fails to start on Windows, see `MONGODB_SETUP_WINDOWS.md` for detailed instructions.

### 3. Backend Setup
```bash
# Navigate to backend
cd Backend

# Install dependencies
npm install

# Create .env file (copy from example or create manually)
# Add these variables:
# MONGODB_URI=mongodb://localhost:27017/cybercrime_tracker
# JWT_SECRET=your_secret_key_here
# PORT=5000

# Start backend server
npm run dev
```

Backend should now be running on `http://localhost:5000`

### 4. Frontend Setup
```bash
# Open a new terminal
# Navigate to frontend
cd Frontend

# Install dependencies
npm install

# Create .env file
# Add: REACT_APP_API_URL=http://localhost:5000/api

# Start frontend
npm start
```

Frontend should now be running on `http://localhost:3000`

### 5. First Login

1. Open `http://localhost:3000` in your browser
2. You'll be redirected to login page
3. Register a new account or use existing credentials
4. After login, you'll see the dashboard

## Creating Your First Admin User

You can create an admin user via API or directly in MongoDB:

### Via API (after starting server):
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "admin123",
    "role": "admin"
  }'
```

### Via MongoDB:
```javascript
// Connect to MongoDB
use cybercrime_tracker

// Insert admin user (password will be hashed automatically)
db.users.insertOne({
  username: "admin",
  email: "admin@example.com",
  password: "$2b$10$YourHashedPasswordHere", // Use bcrypt to hash
  role: "admin",
  is_active: true,
  is_verified: true,
  created_at: new Date()
})
```

## Testing the API

### Health Check
```bash
curl http://localhost:5000/health
```

### Login
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

### Get Attacks (with token)
```bash
curl http://localhost:5000/api/attacks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Quick Start Scripts (Windows)

We've created PowerShell scripts to make setup easier:

1. **Start MongoDB:**
   ```powershell
   .\start-mongodb.ps1
   ```

2. **Start Backend** (in a new terminal):
   ```powershell
   .\start-backend.ps1
   ```

3. **Start Frontend** (in another terminal):
   ```powershell
   .\start-frontend.ps1
   ```

## Common Issues

### MongoDB Connection Error / Data Directory Not Found (Windows)
- **Problem**: `Data directory \data\db not found`
- **Solution**: 
  - Run `.\start-mongodb.ps1` (creates directory automatically)
  - Or manually: `mkdir C:\data\db` (run PowerShell as Administrator)
  - Or use custom path: `mongod --dbpath C:\mongodb-data\db`
  - See `MONGODB_SETUP_WINDOWS.md` for detailed instructions

### MongoDB Connection Error (Linux/Mac)
- **Problem**: Cannot connect to MongoDB
- **Solution**: 
  - Ensure MongoDB is running: `mongod` or `sudo systemctl start mongod`
  - Check connection string in `.env`
  - Verify MongoDB is on default port 27017

### Port Already in Use
- **Problem**: Port 5000 or 3000 already in use
- **Solution**: 
  - Change PORT in backend `.env`
  - Or kill the process: `lsof -ti:5000 | xargs kill` (Mac/Linux)

### CORS Errors
- **Problem**: Frontend can't connect to backend
- **Solution**: 
  - Check `CORS_ORIGIN` in backend `.env` matches frontend URL
  - Default should be `http://localhost:3000`

### Module Not Found
- **Problem**: Missing dependencies
- **Solution**: 
  - Run `npm install` in both Backend and Frontend directories
  - Delete `node_modules` and `package-lock.json`, then reinstall

## Next Steps

1. ✅ Backend and Frontend are running
2. ✅ Create your first user account
3. ✅ Explore the dashboard
4. ✅ Add your first attack record
5. ✅ View statistics and charts

## Development Tips

- Backend auto-reloads with `npm run dev` (nodemon)
- Frontend auto-reloads with `npm start` (React)
- Check browser console for frontend errors
- Check terminal for backend errors
- MongoDB Compass is great for viewing database

## Production Deployment

For production:
1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Enable MongoDB authentication
4. Use environment variables for all secrets
5. Build frontend: `cd Frontend && npm run build`
6. Serve frontend build with a web server (nginx, etc.)

