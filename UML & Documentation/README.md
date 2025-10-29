# 🕵️ Cybercrime Incident Tracker

A comprehensive platform for collecting, analyzing, and visualizing cyberattack incidents from multiple sources using MongoDB and modern web technologies.

## 🎯 Project Overview

**Goal:** Create a platform that collects and analyzes cyberattack incidents (phishing, DDoS, ransomware, etc.) from various sources and provides statistical insights including:
- Most common attack types
- Most affected countries  
- Most active attacker IPs
- Attack trends over time

## 📐 UML Diagrams

This project includes comprehensive UML diagrams for architecture and requirements:

### Available Diagrams
- **📊 Class Diagram** (`class-diagram.puml`) - Complete architecture with 9 MongoDB collections, controllers, services
- **👥 Use Case Diagram** (`usecase-diagram.puml`) - 5 actors, 10 functional packages, 100+ use cases

### Documentation
- **📘 UML Guide** (`UML-GUIDE.md`) - Complete guide (50+ pages) explaining diagrams and generation
- **📗 Database Schema** (`DATABASE-SCHEMA.md`) - Detailed MongoDB schemas (80+ pages)
- **📙 Quick Summary** (`UML-SUMMARY.md`) - Quick 5-minute overview

### Generate Diagrams
```bash
# Windows: Double-click or run in terminal
generate-diagrams.bat

# The script will:
# 1. Download PlantUML if needed
# 2. Generate SVG and PNG files
# 3. Open the output folder
```

**Output:** `output/class-diagram.svg`, `output/usecase-diagram.svg` (and PNG versions)

**Online Viewer:** http://www.plantuml.com/plantuml/uml/ (paste .puml content)

---

## ⚙️ Tech Stack

- **Database:** MongoDB (NoSQL) - 9 collections, 1.5M+ documents estimated
- **Backend:** Node.js + Express
- **Frontend:** React (optional dashboard)
- **APIs:** Integration with VirusTotal, AbuseIPDB, Shodan, OTX
- **Visualization:** Chart.js or Recharts

## 🗂️ Database Design (MongoDB Collections)

### 1️⃣ Attacks Collection
Stores individual cyber incident records:
```json
{
  "_id": ObjectId("..."),
  "type": "Phishing",
  "source_ip": "185.122.54.90",
  "target_country": "Morocco",
  "target_org": "EMSI",
  "date": ISODate("2025-10-19T12:30:00Z"),
  "severity": "High",
  "description": "Phishing attempt detected from known malicious IP.",
  "status": "Mitigated",
  "reported_by": "Abdo",
  "tags": ["email", "social_engineering"]
}
```

### 2️⃣ Sources Collection
Tracks data sources and their metadata:
```json
{
  "_id": ObjectId("..."),
  "name": "AbuseIPDB",
  "type": "API",
  "last_sync": ISODate("2025-10-19T09:00:00Z"),
  "records_collected": 1520
}
```

### 3️⃣ IPs Collection
Maintains information about suspicious IP addresses:
```json
{
  "_id": ObjectId("..."),
  "ip": "185.122.54.90",
  "country": "Russia",
  "reported_count": 45,
  "last_report": ISODate("2025-10-18T22:00:00Z"),
  "threat_score": 85
}
```

### 4️⃣ Users Collection (Optional)
For future authentication features:
```json
{
  "_id": ObjectId("..."),
  "username": "abdo",
  "email": "abdo@example.com",
  "role": "admin"
}
```

## 🔍 Key MongoDB Queries

### Insert New Attack
```javascript
db.attacks.insertOne({
  type: "DDoS",
  source_ip: "103.212.45.90",
  target_country: "Morocco",
  date: new Date(),
  severity: "Critical",
  description: "Massive traffic detected targeting gov site",
  status: "Under investigation"
})
```

### Count Attacks by Country
```javascript
db.attacks.aggregate([
  { $group: { _id: "$target_country", total: { $sum: 1 } } },
  { $sort: { total: -1 } }
])
```

### Top Attack Types
```javascript
db.attacks.aggregate([
  { $group: { _id: "$type", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

### Most Dangerous IPs
```javascript
db.ips.find().sort({ threat_score: -1 }).limit(10)
```

## 🏗️ Backend Architecture (Node.js + Express)

### Project Structure
```
cybercrime-tracker/
├── server.js
├── package.json
├── /config
│   └── db.js
├── /models
│   ├── Attack.js
│   ├── IP.js
│   ├── Source.js
│   └── User.js
├── /routes
│   ├── attacks.js
│   ├── ips.js
│   ├── sources.js
│   └── users.js
├── /controllers
│   ├── attackController.js
│   ├── ipController.js
│   ├── sourceController.js
│   └── userController.js
└── /middleware
    └── auth.js
```

### Example Model (Attack.js)
```javascript
const mongoose = require("mongoose");

const attackSchema = new mongoose.Schema({
  type: String,
  source_ip: String,
  target_country: String,
  target_org: String,
  date: { type: Date, default: Date.now },
  severity: String,
  description: String,
  status: String,
  tags: [String]
});

module.exports = mongoose.model("Attack", attackSchema);
```

### Example Route (attacks.js)
```javascript
const express = require("express");
const router = express.Router();
const { getAllAttacks, addAttack } = require("../controllers/attackController");

router.get("/", getAllAttacks);
router.post("/", addAttack);

module.exports = router;
```

### Example Controller (attackController.js)
```javascript
const Attack = require("../models/Attack");

exports.getAllAttacks = async (req, res) => {
  const attacks = await Attack.find().sort({ date: -1 });
  res.json(attacks);
};

exports.addAttack = async (req, res) => {
  const newAttack = new Attack(req.body);
  await newAttack.save();
  res.status(201).json({ message: "Attack added successfully" });
};
```

## 📊 Frontend Dashboard Features (React)

### Visualization Components
- **Top 5 Attack Types** (Bar Chart)
- **Attacks by Country** (Map or Pie Chart)
- **Recent Incidents** (Data Table)
- **Severity Distribution** (Doughnut Chart)
- **Attack Trends Over Time** (Line Chart)

### Dashboard Layout
```
┌─────────────────────────────────────────────────────────┐
│                    Cybercrime Dashboard                 │
├─────────────────────────────────────────────────────────┤
│  [Attack Stats Cards]  │  [Top Attack Types Chart]     │
├─────────────────────────────────────────────────────────┤
│  [Attacks by Country]  │  [Severity Distribution]      │
├─────────────────────────────────────────────────────────┤
│              [Recent Incidents Table]                  │
├─────────────────────────────────────────────────────────┤
│              [Attack Trends Timeline]                   │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Core Features

### Data Collection
- Manual incident reporting
- API integration with threat intelligence sources
- Automated data synchronization
- Data validation and deduplication

### Analysis & Filtering
- Filter by attack type, region, or time range
- Search functionality across all fields
- Advanced aggregation pipelines
- Pattern detection algorithms

### Visualization
- Interactive charts and graphs
- Geographic mapping of attacks
- Real-time dashboard updates
- Export capabilities (PDF, CSV)

### Security & Access
- User authentication and authorization
- Role-based access control
- API rate limiting
- Data encryption

## 🧠 Learning Objectives

### MongoDB Skills
- ✅ NoSQL data modeling (documents, collections, embedded arrays)
- ✅ CRUD operations in MongoDB
- ✅ Aggregation pipelines and analytics
- ✅ Indexing and performance optimization
- ✅ Data relationships and references

### Backend Development
- ✅ RESTful API creation with Node.js
- ✅ Express.js routing and middleware
- ✅ Mongoose ODM for MongoDB
- ✅ Error handling and validation
- ✅ API documentation

### Frontend Development (Optional)
- ✅ React component development
- ✅ Data visualization with Chart.js/Recharts
- ✅ Responsive dashboard design
- ✅ State management
- ✅ API integration

## 📋 Development Phases

### Phase 1: Database Setup
- [ ] Design MongoDB collections
- [ ] Create database schemas
- [ ] Set up connection configuration
- [ ] Implement basic CRUD operations

### Phase 2: Backend API
- [ ] Set up Express.js server
- [ ] Create RESTful endpoints
- [ ] Implement data validation
- [ ] Add error handling
- [ ] Create aggregation queries

### Phase 3: Data Integration
- [ ] Integrate with external APIs
- [ ] Implement data synchronization
- [ ] Add data deduplication
- [ ] Create data import/export features

### Phase 4: Frontend Dashboard (Optional)
- [ ] Set up React application
- [ ] Create dashboard components
- [ ] Implement data visualization
- [ ] Add responsive design
- [ ] Integrate with backend API

### Phase 5: Advanced Features
- [ ] User authentication
- [ ] Real-time notifications
- [ ] Advanced analytics
- [ ] Performance optimization
- [ ] Testing and deployment

## 🔧 Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Git

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd cybercrime-tracker

# Install dependencies
npm install

# Start MongoDB service
mongod

# Run the application
npm start
```

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://reactjs.org/)
- [Chart.js Documentation](https://www.chartjs.org/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Note:** This project is designed for educational purposes and should be used responsibly. Always ensure compliance with local laws and regulations when handling cybersecurity data.
