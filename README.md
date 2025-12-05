# 🕵️ Cybercrime Incident Tracker

A comprehensive platform for collecting, analyzing, and visualizing cyberattack incidents from multiple sources using MongoDB and modern web technologies.

## 🎯 Project Overview

This platform collects and analyzes cyberattack incidents (phishing, DDoS, ransomware, etc.) from various sources and provides statistical insights including:
- Most common attack types
- Most affected countries  
- Most active attacker IPs
- Attack trends over time

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cybercrime-tracker
   ```

2. **Install Backend Dependencies**
   ```bash
   cd Backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../Frontend
   npm install
   ```

4. **Configure Environment Variables**

   Create a `.env` file in the root directory:
   ```env
   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/cybercrime_tracker

   # JWT
   JWT_SECRET=your_super_secret_jwt_key_change_this
   JWT_REFRESH_SECRET=your_refresh_token_secret
   JWT_EXPIRE=15m
   JWT_REFRESH_EXPIRE=7d

   # Server
   PORT=5000
   NODE_ENV=development

   # CORS
   CORS_ORIGIN=http://localhost:3000
   ```

   For the frontend, create a `.env` file in the `Frontend` directory:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

5. **Start MongoDB**
   ```bash
   mongod
   ```

6. **Start Backend Server**
   ```bash
   cd Backend
   npm run dev
   ```
   The backend will run on `http://localhost:5000`

7. **Start Frontend**
   ```bash
   cd Frontend
   npm start
   ```
   The frontend will run on `http://localhost:3000`

## 📁 Project Structure

```
cybercrime-tracker/
├── Backend/
│   ├── controllers/      # Request handlers
│   ├── models/          # Mongoose models (9 collections)
│   ├── routes/          # API routes
│   ├── middleware/      # Auth, validation, error handling
│   ├── services/        # Business logic services
│   └── server.js        # Express server entry point
├── Frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API service calls
│   │   ├── context/     # React Context providers
│   │   └── App.js       # Main React component
│   └── public/          # Static files
├── Configuration/
│   └── config/         # Configuration files
└── Tests/              # Test files
```

## 🗄️ Database Collections

The project uses 9 MongoDB collections:

1. **Attacks** - Cyberattack incidents
2. **IPs** - Suspicious IP addresses
3. **Sources** - Data source configurations
4. **Users** - User accounts and authentication
5. **Reports** - Generated reports
6. **Alerts** - System alerts
7. **ThreatIntelligence** - Threat indicators (IOCs)
8. **Vulnerability** - CVE vulnerabilities
9. **AuditLog** - System audit logs

## 🔌 API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login
- `POST /api/users/logout` - Logout
- `GET /api/users/profile` - Get current user profile

### Attacks
- `GET /api/attacks` - Get all attacks (with filters)
- `GET /api/attacks/:id` - Get attack by ID
- `POST /api/attacks` - Create new attack
- `PUT /api/attacks/:id` - Update attack
- `DELETE /api/attacks/:id` - Delete attack
- `GET /api/attacks/statistics` - Get attack statistics

### IPs
- `GET /api/ips` - Get all IPs
- `GET /api/ips/:id` - Get IP by ID
- `GET /api/ips/top-dangerous` - Get top dangerous IPs
- `POST /api/ips` - Create or update IP
- `PUT /api/ips/:id` - Update IP
- `DELETE /api/ips/:id` - Delete IP

### Dashboard
- `GET /api/dashboard/overview` - Get dashboard overview
- `GET /api/dashboard/trends` - Get attack trends
- `GET /api/dashboard/top-countries` - Get top countries

### Other Endpoints
- `GET /api/sources` - Get all data sources
- `GET /api/reports` - Get all reports
- `GET /api/alerts` - Get all alerts

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_token>
```

## 🧪 Testing

```bash
# Backend tests
cd Backend
npm test

# Frontend tests
cd Frontend
npm test
```

## 📊 Features

### Backend
- ✅ RESTful API with Express.js
- ✅ MongoDB with Mongoose ODM
- ✅ JWT Authentication
- ✅ Role-Based Access Control (RBAC)
- ✅ Request validation
- ✅ Error handling
- ✅ Rate limiting
- ✅ Audit logging

### Frontend
- ✅ React with React Router
- ✅ Authentication context
- ✅ Dashboard with charts
- ✅ Attack listing and filtering
- ✅ Responsive design

## 🛠️ Development

### Backend Development
```bash
cd Backend
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development
```bash
cd Frontend
npm start  # Starts development server with hot reload
```

## 📝 Environment Variables

See `.env.example` files for required environment variables.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📚 Documentation

For detailed documentation, see:
- `UML & Documentation/README.md` - Project overview
- `UML & Documentation/DATABASE-SCHEMA.md` - Database schema details
- `UML & Documentation/PROJECT-STRUCTURE.md` - Project structure

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env` file
- Verify MongoDB is accessible on the specified port

### Port Already in Use
- Change `PORT` in `.env` file
- Or stop the process using the port

### CORS Errors
- Update `CORS_ORIGIN` in backend `.env` to match frontend URL
- Default: `http://localhost:3000`

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Note:** This project is designed for educational purposes. Always ensure compliance with local laws and regulations when handling cybersecurity data.

