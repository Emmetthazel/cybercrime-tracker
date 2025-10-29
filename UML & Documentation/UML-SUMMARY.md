# 📐 Résumé des Diagrammes UML
# Cybercrime Tracker

## 🎯 Vue d'ensemble rapide

Ce projet contient une architecture complète orientée base de données pour le tracking et l'analyse d'incidents de cybersécurité.

---

## 📊 Diagramme de Classes

### Statistiques
- **4 couches** d'architecture
- **9 collections MongoDB**
- **7 contrôleurs**
- **7 services métier**
- **4 utilitaires**
- **30+ relations** entre entités

### Collections principales

| Collection | Rôle | Documents estimés |
|-----------|------|-------------------|
| **Attack** | Incidents de cybersécurité | 100,000+ |
| **IP** | Adresses IP suspectes | 50,000+ |
| **Source** | Sources de données externes | 10-50 |
| **User** | Utilisateurs du système | 100-1,000 |
| **Report** | Rapports générés | 1,000+ |
| **Alert** | Alertes système | 10,000+ |
| **ThreatIntelligence** | IOCs et menaces | 50,000+ |
| **Vulnerability** | CVEs et vulnérabilités | 200,000+ |
| **AuditLog** | Logs d'audit | 1,000,000+ |

### Services clés

1. **AnalyticsService** - Analyses avancées et prédictions
2. **ThreatIntelService** - Intelligence des menaces
3. **ExternalAPIService** - Intégration APIs (VirusTotal, AbuseIPDB, Shodan, OTX)
4. **NotificationService** - Email, SMS, Push notifications
5. **DataSyncService** - Synchronisation et déduplication
6. **ExportService** - Export multi-formats (PDF, CSV, Excel, JSON)
7. **AuthService** - JWT et authentification

---

## 👥 Diagramme de Cas d'Utilisation

### Statistiques
- **5 acteurs**
- **10 packages fonctionnels**
- **100+ cas d'utilisation**
- **Relations `<<include>>` et `<<extend>>`**

### Acteurs

| Acteur | Rôle | Use Cases |
|--------|------|-----------|
| 🔴 **Administrateur** | Gestion complète du système | 15+ |
| 🔵 **Analyste Sécurité** | Gestion quotidienne et analyses | 60+ |
| ⚪ **Utilisateur Standard** | Consultation et création basique | 10+ |
| 🟢 **API Externe** | Enrichissement automatique | 8+ |
| 🟡 **Système Sync** | Automatisation et notifications | 8+ |

### Packages fonctionnels

1. **Gestion des Incidents** - 15 use cases
   - CRUD complet
   - Import/Export masse
   - Gestion preuves et mitigations

2. **Gestion des IPs** - 9 use cases
   - Tracking complet
   - Enrichissement via APIs
   - Blacklisting

3. **Analyse et Statistiques** - 10 use cases
   - Dashboard interactif
   - Détection patterns
   - Prédictions IA

4. **Rapports et Export** - 9 use cases
   - Multi-formats
   - Planification automatique

5. **Alertes et Notifications** - 9 use cases
   - Multi-canaux
   - Workflow escalade

6. **Gestion Utilisateurs** - 10 use cases
   - RBAC
   - Authentification sécurisée

7. **Intelligence Menaces** - 7 use cases
   - IOCs
   - Tracking TTPs

8. **Gestion Vulnérabilités** - 6 use cases
   - Base CVE
   - Tracking exploits

9. **Sources de Données** - 8 use cases
   - Configuration multi-sources
   - Synchronisation auto

10. **Visualisation** - 6 use cases
    - Cartes géographiques
    - Dashboard personnalisable

---

## 📁 Fichiers générés

```
cybercrime-tracker/
├── class-diagram.puml          # Diagramme de classes PlantUML
├── usecase-diagram.puml        # Diagramme use case PlantUML
├── UML-GUIDE.md                # Guide complet (50+ pages)
├── DATABASE-SCHEMA.md          # Schémas MongoDB détaillés
├── UML-SUMMARY.md             # Ce fichier - résumé rapide
├── generate-diagrams.bat       # Script génération automatique
└── README.md                   # Documentation principale
```

---

## 🚀 Génération rapide

### Windows
```batch
# Double-cliquer sur :
generate-diagrams.bat

# Ou en ligne de commande :
java -jar plantuml.jar -tsvg *.puml
```

### Résultat
```
output/
├── class-diagram.svg
├── class-diagram.png
├── usecase-diagram.svg
└── usecase-diagram.png
```

---

## 🗄️ Base de données MongoDB

### Volumétrie totale estimée

| Métrique | Valeur |
|----------|--------|
| **Total documents** | ~1.5 million |
| **Taille DB** | 5-10 GB |
| **Collections** | 9 principales |
| **Index** | 40+ index |
| **Lectures/jour** | 100,000+ |
| **Écritures/jour** | 5,000-10,000 |

### Collections avec le plus de données

1. 🥇 **AuditLog** - 1,000,000+ documents
2. 🥈 **Vulnerability** - 200,000+ documents
3. 🥉 **Attack** - 100,000+ documents
4. **ThreatIntelligence** - 50,000+ documents
5. **IP** - 50,000+ documents

### APIs externes intégrées

1. **VirusTotal** - Analyse malwares et réputation
2. **AbuseIPDB** - Réputation IPs et reporting
3. **Shodan** - Scan réseau et vulnérabilités
4. **OTX AlienVault** - Threat intelligence collaborative

---

## 🎨 Architecture en couches

```
┌─────────────────────────────────────────┐
│         Frontend (React)                 │
│  Dashboard, Charts, Maps, Tables        │
└─────────────────┬───────────────────────┘
                  │ REST API
┌─────────────────▼───────────────────────┐
│      Controllers Layer                   │
│  AttackController, IPController, etc.   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│       Services Layer                     │
│  Analytics, ThreatIntel, External APIs  │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      Database Layer (MongoDB)            │
│  9 Collections avec relations           │
└─────────────────────────────────────────┘
```

---

## 📊 Exemple de requête complexe

### Dashboard - Vue d'ensemble complète

```javascript
// Agrégation multi-facettes
db.attacks.aggregate([
  {
    $facet: {
      attack_types: [
        { $group: { _id: "$type", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ],
      targeted_countries: [
        { $group: { _id: "$target_country", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ],
      time_series: [
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            count: { $sum: 1 }
          }
        }
      ]
    }
  }
]);
```

**Résultat :**
- Top 10 types d'attaques
- Top 10 pays ciblés
- Série temporelle complète
- En une seule requête optimisée

---

## 🔍 Fonctionnalités avancées

### 1. Détection de patterns
- Corrélation automatique d'incidents
- Identification de campagnes coordonnées
- Clustering d'attaques similaires
- Détection d'anomalies

### 2. Enrichissement automatique
- APIs externes (VirusTotal, AbuseIPDB, Shodan)
- Géolocalisation IPs
- WHOIS automatique
- Calcul scores de menace

### 3. Alertes intelligentes
- Seuils configurables
- Multi-canaux (Email, SMS, Push)
- Escalade automatique
- Workflow d'accusé de réception

### 4. Rapports personnalisables
- Filtres avancés
- Export multi-formats (PDF, CSV, Excel, JSON)
- Planification automatique
- Graphiques intégrés

### 5. Visualisations
- Cartes géographiques interactives
- Graphiques temps réel
- Timeline d'attaques
- Heat maps de menaces

---

## 🔐 Sécurité

### Authentification
- JWT avec refresh tokens
- 2FA (Two-Factor Authentication)
- Rate limiting
- Session management

### Autorisation
- RBAC (Role-Based Access Control)
- Permissions granulaires
- Audit trail complet
- Logs d'activité

### Données sensibles
- Encryption at rest (MongoDB)
- Hashing bcrypt (cost 12)
- API keys chiffrées
- HTTPS/TLS obligatoire

---

## 📈 Scalabilité

### Horizontal scaling
```javascript
// Sharding MongoDB
sh.enableSharding("cybercrime_tracker");
sh.shardCollection(
  "cybercrime_tracker.attacks",
  { "date": 1, "_id": 1 }
);
```

### Optimisations
- 40+ index MongoDB
- Caching (Redis)
- Pagination efficace
- Requêtes optimisées

### Archivage
- Archivage automatique (>2 ans)
- Compression des anciennes données
- Stratégie de rétention configurable

---

## 🧪 Cas d'usage réels

### Scénario 1 : Détection d'une campagne de phishing
1. Source externe (AbuseIPDB) signale nouvelle IP suspecte
2. Système crée automatiquement entrée dans collection `ips`
3. Enrichissement via VirusTotal, Shodan
4. Corrélation avec attaques existantes
5. Alerte créée si pattern détecté
6. Notification envoyée aux analystes
7. Dashboard mis à jour en temps réel

### Scénario 2 : Analyse post-incident
1. Analyste recherche attaques similaires (filtres avancés)
2. Système affiche incidents corrélés
3. Vue chronologique des événements
4. Identification des IPs sources communes
5. Génération rapport automatique
6. Export en PDF pour documentation
7. Partage sécurisé avec équipe

### Scénario 3 : Rapport mensuel automatique
1. Planificateur déclenche génération (1er du mois)
2. Agrégation des données du mois précédent
3. Calcul statistiques et tendances
4. Génération graphiques
5. Export en PDF
6. Envoi automatique par email aux stakeholders
7. Archivage dans collection `reports`

---

## 📚 Documentation complète

| Document | Description | Pages |
|----------|-------------|-------|
| **UML-GUIDE.md** | Guide complet des diagrammes | 50+ |
| **DATABASE-SCHEMA.md** | Schémas MongoDB détaillés | 80+ |
| **UML-SUMMARY.md** | Résumé rapide (ce fichier) | 5 |
| **README.md** | Documentation projet | 40+ |

---

## 🎓 Technologies utilisées

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Mongoose** - ODM MongoDB
- **JWT** - Authentification
- **Bcrypt** - Hashing passwords

### Database
- **MongoDB** - Base NoSQL principale
- **Redis** - Cache (optionnel)
- **Indexes** - 40+ index optimisés

### Frontend
- **React** - UI Library
- **Chart.js** - Visualisations
- **Recharts** - Graphiques avancés
- **Leaflet** - Cartes géographiques

### APIs externes
- **VirusTotal API** - Malware analysis
- **AbuseIPDB API** - IP reputation
- **Shodan API** - Network scanning
- **OTX API** - Threat intelligence

---

## 🚀 Quick Start

### 1. Visualiser les diagrammes

**En ligne :**
1. Aller sur http://www.plantuml.com/plantuml/uml/
2. Copier le contenu de `class-diagram.puml` ou `usecase-diagram.puml`
3. Visualiser

**Localement :**
```batch
# Double-cliquer sur generate-diagrams.bat
# Les images seront dans le dossier output/
```

### 2. Comprendre l'architecture
1. Lire **UML-SUMMARY.md** (ce fichier) - 5 min
2. Consulter **UML-GUIDE.md** - 30 min
3. Explorer **DATABASE-SCHEMA.md** - 1 heure

### 3. Implémenter le projet
1. Suivre le README principal
2. Créer les collections MongoDB
3. Implémenter les contrôleurs
4. Ajouter les services
5. Créer le frontend

---

## 📞 Support et ressources

### Documentation
- MongoDB : https://docs.mongodb.com
- PlantUML : https://plantuml.com
- Express.js : https://expressjs.com
- React : https://reactjs.org

### APIs
- VirusTotal : https://developers.virustotal.com
- AbuseIPDB : https://docs.abuseipdb.com
- Shodan : https://developer.shodan.io
- OTX : https://otx.alienvault.com/api

---

## ✨ Points forts du design

### ✅ Orienté Base de Données
- 9 collections robustes
- Relations bien définies
- Index optimisés
- Requêtes d'agrégation puissantes

### ✅ Scalable
- Architecture en couches
- Sharding MongoDB possible
- Caching intégré
- Microservices-ready

### ✅ Sécurisé
- RBAC complet
- Encryption at rest
- JWT + 2FA
- Audit trail

### ✅ Intelligent
- Enrichissement automatique
- Détection de patterns
- Corrélation d'incidents
- Alertes prédictives

### ✅ Extensible
- APIs bien documentées
- Services modulaires
- Plugins possibles
- Multi-sources

---

**Créé par :** Abdelkhalek  
**Date :** Octobre 2025  
**Version :** 1.0  
**Licence :** MIT

---

## 🎯 Prochaines étapes

1. ✅ Diagrammes UML créés
2. ✅ Documentation complète
3. ⏳ Implémentation backend
4. ⏳ Création collections MongoDB
5. ⏳ Développement frontend
6. ⏳ Tests et déploiement

**Happy Coding! 🚀**

