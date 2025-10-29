# 📁 Structure du Projet - Cybercrime Tracker

## 📂 Arborescence complète

```
cybercrime-tracker/
│
├── 📐 UML & Documentation
│   ├── class-diagram.puml              # Diagramme de classes PlantUML
│   ├── usecase-diagram.puml            # Diagramme de cas d'utilisation
│   ├── UML-GUIDE.md                    # Guide complet des diagrammes (50+ pages)
│   ├── DATABASE-SCHEMA.md              # Schémas MongoDB détaillés (80+ pages)
│   ├── UML-SUMMARY.md                  # Résumé rapide (5 min)
│   ├── PROJECT-STRUCTURE.md            # Ce fichier - structure du projet
│   └── generate-diagrams.bat           # Script Windows pour générer les images
│
├── 📊 Output (généré)
│   ├── class-diagram.svg               # Diagramme de classes (vectoriel)
│   ├── class-diagram.png               # Diagramme de classes (image)
│   ├── usecase-diagram.svg             # Diagramme use case (vectoriel)
│   └── usecase-diagram.png             # Diagramme use case (image)
│
├── 🔧 Configuration
│   ├── config/
│   │   ├── db.js                       # Configuration MongoDB
│   │   ├── api-keys.example.json       # Exemple clés API (à copier)
│   │   └── config.js                   # Configuration générale
│   │
│   ├── .env.example                    # Variables d'environnement exemple
│   ├── .gitignore                      # Fichiers à ignorer par Git
│   └── package.json                    # Dépendances Node.js
│
├── 🗄️ Backend (Node.js + Express)
│   ├── server.js                       # Point d'entrée serveur
│   │
│   ├── models/                         # Modèles Mongoose (9 collections)
│   │   ├── Attack.js                   # Modèle incidents cybersécurité
│   │   ├── IP.js                       # Modèle adresses IP suspectes
│   │   ├── Source.js                   # Modèle sources de données
│   │   ├── User.js                     # Modèle utilisateurs
│   │   ├── Report.js                   # Modèle rapports générés
│   │   ├── Alert.js                    # Modèle alertes système
│   │   ├── ThreatIntelligence.js       # Modèle intelligence menaces
│   │   ├── Vulnerability.js            # Modèle vulnérabilités CVE
│   │   └── AuditLog.js                 # Modèle logs d'audit
│   │
│   ├── controllers/                    # Contrôleurs REST API
│   │   ├── attackController.js         # CRUD attaques + statistiques
│   │   ├── ipController.js             # Gestion IPs + enrichissement
│   │   ├── sourceController.js         # Gestion sources + sync
│   │   ├── userController.js           # Authentification + gestion users
│   │   ├── reportController.js         # Génération + export rapports
│   │   ├── alertController.js          # Gestion alertes + notifications
│   │   └── dashboardController.js      # Agrégations dashboard
│   │
│   ├── services/                       # Services métier
│   │   ├── analyticsService.js         # Analyses avancées + prédictions
│   │   ├── threatIntelService.js       # Enrichissement threat intel
│   │   ├── externalAPIService.js       # Intégration APIs externes
│   │   ├── notificationService.js      # Email, SMS, Push notifications
│   │   ├── dataSyncService.js          # Synchronisation sources
│   │   ├── exportService.js            # Export PDF, CSV, Excel, JSON
│   │   └── authService.js              # JWT, hashing, authentification
│   │
│   ├── routes/                         # Routes Express
│   │   ├── attacks.js                  # Routes /api/attacks
│   │   ├── ips.js                      # Routes /api/ips
│   │   ├── sources.js                  # Routes /api/sources
│   │   ├── users.js                    # Routes /api/users
│   │   ├── reports.js                  # Routes /api/reports
│   │   ├── alerts.js                   # Routes /api/alerts
│   │   └── dashboard.js                # Routes /api/dashboard
│   │
│   ├── middleware/                     # Middlewares Express
│   │   ├── auth.js                     # Vérification JWT
│   │   ├── rbac.js                     # Role-Based Access Control
│   │   ├── validation.js               # Validation des données
│   │   ├── rateLimit.js                # Rate limiting
│   │   ├── errorHandler.js             # Gestion erreurs globale
│   │   └── logger.js                   # Logging requêtes
│   │
│   └── utils/                          # Utilitaires
│       ├── validationUtil.js           # Validation IP, email, etc.
│       ├── loggerUtil.js               # Logger Winston
│       ├── cacheUtil.js                # Cache Redis
│       └── configUtil.js               # Gestion configuration
│
├── 🎨 Frontend (React)
│   ├── public/
│   │   └── index.html
│   │
│   └── src/
│       ├── App.js                      # Composant principal
│       │
│       ├── components/                 # Composants React
│       │   ├── Dashboard/
│       │   │   ├── Dashboard.jsx       # Tableau de bord principal
│       │   │   ├── AttackStats.jsx     # Cartes statistiques
│       │   │   ├── AttackChart.jsx     # Graphique types d'attaques
│       │   │   ├── CountryMap.jsx      # Carte géographique
│       │   │   ├── SeverityChart.jsx   # Distribution gravité
│       │   │   └── Timeline.jsx        # Timeline d'attaques
│       │   │
│       │   ├── Attacks/
│       │   │   ├── AttackList.jsx      # Liste des attaques
│       │   │   ├── AttackDetail.jsx    # Détails d'une attaque
│       │   │   ├── AttackForm.jsx      # Formulaire création/édition
│       │   │   └── AttackSearch.jsx    # Recherche avancée
│       │   │
│       │   ├── IPs/
│       │   │   ├── IPList.jsx          # Liste IPs suspectes
│       │   │   ├── IPDetail.jsx        # Détails IP enrichis
│       │   │   └── IPMap.jsx           # Carte géographique IPs
│       │   │
│       │   ├── Reports/
│       │   │   ├── ReportList.jsx      # Liste rapports
│       │   │   ├── ReportGenerator.jsx # Générateur de rapports
│       │   │   └── ReportViewer.jsx    # Visualiseur de rapports
│       │   │
│       │   ├── Alerts/
│       │   │   ├── AlertList.jsx       # Liste alertes
│       │   │   └── AlertNotification.jsx # Notifications en temps réel
│       │   │
│       │   ├── Auth/
│       │   │   ├── Login.jsx           # Page de connexion
│       │   │   ├── Register.jsx        # Inscription (si activé)
│       │   │   └── PasswordReset.jsx   # Réinitialisation mot de passe
│       │   │
│       │   └── Common/
│       │       ├── Header.jsx          # En-tête navigation
│       │       ├── Sidebar.jsx         # Menu latéral
│       │       ├── Footer.jsx          # Pied de page
│       │       ├── Loading.jsx         # Spinner de chargement
│       │       └── ErrorBoundary.jsx   # Gestion erreurs React
│       │
│       ├── services/                   # Services API frontend
│       │   ├── api.js                  # Client API Axios
│       │   ├── attackService.js        # Appels API attaques
│       │   ├── ipService.js            # Appels API IPs
│       │   ├── reportService.js        # Appels API rapports
│       │   └── authService.js          # Appels API auth
│       │
│       ├── context/                    # Context API React
│       │   ├── AuthContext.js          # Contexte authentification
│       │   └── ThemeContext.js         # Contexte thème (dark/light)
│       │
│       ├── hooks/                      # Custom React Hooks
│       │   ├── useAuth.js              # Hook authentification
│       │   ├── useAttacks.js           # Hook gestion attaques
│       │   └── useWebSocket.js         # Hook WebSocket temps réel
│       │
│       └── utils/
│           ├── formatters.js           # Formatage dates, nombres, etc.
│           └── validators.js           # Validation formulaires
│
├── 🧪 Tests
│   ├── unit/                           # Tests unitaires
│   │   ├── models/
│   │   ├── controllers/
│   │   └── services/
│   │
│   ├── integration/                    # Tests d'intégration
│   │   └── api/
│   │
│   └── e2e/                            # Tests end-to-end
│       └── scenarios/
│
├── 📜 Scripts
│   ├── setup-db.js                     # Initialisation DB + index
│   ├── seed-data.js                    # Données de test
│   ├── backup-db.js                    # Backup MongoDB
│   └── migrate.js                      # Migrations schéma
│
├── 📚 Documentation
│   ├── README.md                       # Documentation principale
│   ├── API-DOCUMENTATION.md            # Documentation API REST
│   ├── DEPLOYMENT.md                   # Guide de déploiement
│   └── CONTRIBUTING.md                 # Guide de contribution
│
└── 🚀 Déploiement
    ├── docker-compose.yml              # Orchestration Docker
    ├── Dockerfile                      # Image Docker backend
    ├── nginx.conf                      # Configuration Nginx
    └── .github/
        └── workflows/
            └── ci-cd.yml               # Pipeline CI/CD GitHub Actions
```

---

## 📊 Statistiques du projet

### Fichiers
- **Total fichiers :** ~80 fichiers
- **Lignes de code estimées :** 10,000-15,000 lignes
- **Documentation :** 150+ pages

### Collections MongoDB
- **9 collections principales**
- **40+ index**
- **1.5M+ documents estimés**
- **5-10 GB volumétrie**

### API Endpoints
- **40+ endpoints REST**
- **4 APIs externes intégrées**
- **WebSocket pour temps réel**

---

## 🚀 Commandes principales

### Développement

```bash
# Backend
cd backend
npm install
npm run dev              # Mode développement avec nodemon

# Frontend
cd frontend
npm install
npm start                # Mode développement React

# Base de données
mongod                   # Démarrer MongoDB
node scripts/setup-db.js # Initialiser DB + index
node scripts/seed-data.js # Charger données de test
```

### Tests

```bash
# Tests unitaires
npm run test:unit

# Tests d'intégration
npm run test:integration

# Tests end-to-end
npm run test:e2e

# Coverage
npm run test:coverage
```

### Production

```bash
# Build frontend
cd frontend
npm run build

# Démarrer backend en production
cd backend
npm start

# Docker
docker-compose up -d     # Démarrer tous les services
docker-compose logs -f   # Voir les logs
docker-compose down      # Arrêter tous les services
```

### Diagrammes UML

```bash
# Générer les diagrammes
generate-diagrams.bat    # Windows

# Ou manuellement avec PlantUML
java -jar plantuml.jar -tsvg class-diagram.puml
java -jar plantuml.jar -tsvg usecase-diagram.puml
```

---

## 📦 Dépendances principales

### Backend (package.json)

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "axios": "^1.5.0",
    "redis": "^4.6.10",
    "winston": "^3.10.0",
    "nodemailer": "^6.9.5",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "eslint": "^8.49.0"
  }
}
```

### Frontend (package.json)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.16.0",
    "axios": "^1.5.0",
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0",
    "recharts": "^2.8.0",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "date-fns": "^2.30.0",
    "socket.io-client": "^4.7.2"
  },
  "devDependencies": {
    "react-scripts": "^5.0.1",
    "@testing-library/react": "^14.0.0",
    "cypress": "^13.3.0"
  }
}
```

---

## 🔐 Fichiers de configuration

### .env.example

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/cybercrime_tracker
MONGODB_TEST_URI=mongodb://localhost:27017/cybercrime_tracker_test

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# APIs externes
VIRUSTOTAL_API_KEY=your_virustotal_api_key
ABUSEIPDB_API_KEY=your_abuseipdb_api_key
SHODAN_API_KEY=your_shodan_api_key
OTX_API_KEY=your_otx_api_key

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Redis (optionnel)
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=5000
NODE_ENV=development

# Frontend
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🎯 Prochaines étapes d'implémentation

### Phase 1 : Setup initial ✅
- [x] Créer diagrammes UML
- [x] Documenter architecture
- [x] Définir schémas MongoDB
- [ ] Initialiser projet Node.js
- [ ] Configurer structure dossiers

### Phase 2 : Backend Core
- [ ] Créer modèles Mongoose (9 collections)
- [ ] Implémenter contrôleurs basiques
- [ ] Créer routes API
- [ ] Ajouter middleware auth
- [ ] Implémenter RBAC

### Phase 3 : Services avancés
- [ ] Service Analytics
- [ ] Service Threat Intelligence
- [ ] Intégration APIs externes
- [ ] Service Notifications
- [ ] Service Export

### Phase 4 : Frontend
- [ ] Setup React
- [ ] Créer Dashboard
- [ ] Composants CRUD
- [ ] Visualisations (charts, maps)
- [ ] Authentification UI

### Phase 5 : Finalisation
- [ ] Tests unitaires
- [ ] Tests d'intégration
- [ ] Documentation API
- [ ] Déploiement
- [ ] Monitoring

---

## 📞 Ressources et liens utiles

### Documentation externe
- MongoDB : https://docs.mongodb.com
- Express.js : https://expressjs.com
- React : https://react.dev
- PlantUML : https://plantuml.com

### APIs externes
- VirusTotal : https://developers.virustotal.com
- AbuseIPDB : https://docs.abuseipdb.com
- Shodan : https://developer.shodan.io
- OTX : https://otx.alienvault.com/api

### Outils de visualisation
- Chart.js : https://www.chartjs.org
- Recharts : https://recharts.org
- Leaflet : https://leafletjs.com

---

**Dernière mise à jour :** Octobre 2025  
**Maintenu par :** Abdelkhalek  
**Version :** 1.0

