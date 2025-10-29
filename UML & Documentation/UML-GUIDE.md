# 📐 Guide des Diagrammes UML - Cybercrime Tracker

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Diagramme de classes](#diagramme-de-classes)
3. [Diagramme de cas d'utilisation](#diagramme-de-cas-dutilisation)
4. [Comment générer les diagrammes](#comment-générer-les-diagrammes)
5. [Structure de la base de données](#structure-de-la-base-de-données)

---

## 🎯 Vue d'ensemble

Ce projet contient deux diagrammes UML complets en PlantUML :

### Fichiers générés :
- **`class-diagram.puml`** - Diagramme de classes détaillé de l'architecture
- **`usecase-diagram.puml`** - Diagramme de cas d'utilisation complet

---

## 📊 Diagramme de Classes

### Architecture en 4 couches

Le diagramme de classes présente une architecture robuste orientée base de données :

#### 1️⃣ **Database Layer (MongoDB Collections)**

##### Collections principales :

**Attack** - Collection centrale du système
- Stocke tous les incidents de cybersécurité
- 20+ attributs incluant : type, gravité, pays ciblé, impact financier
- Relations avec : User, IP, autres Attacks
- Méthodes : recherche par type/gravité/pays, gestion des mitigations

**IP** - Tracking des adresses IP suspectes
- Enrichissement automatique via APIs externes
- Calcul de scores de menace et réputation
- Géolocalisation et données WHOIS
- Relations avec : Attacks, ThreatIntelligence

**Source** - Gestion des sources de données externes
- Configuration des APIs (VirusTotal, AbuseIPDB, etc.)
- Synchronisation automatique et planifiée
- Gestion des erreurs et rate limiting
- Métriques de fiabilité

**User** - Gestion des utilisateurs
- Authentification et autorisation
- Rôles et permissions granulaires
- Préférences de notifications
- Tracking des connexions

**Report** - Génération de rapports
- Rapports personnalisables avec filtres
- Export multi-formats (PDF, CSV, JSON, Excel)
- Statistiques et graphiques intégrés
- Planification automatique

**Alert** - Système d'alertes
- Alertes basées sur des seuils configurables
- Workflow d'accusé de réception et résolution
- Escalade automatique
- Notifications multi-canaux

**ThreatIntelligence** - Intelligence des menaces
- Indicateurs de compromission (IOCs)
- Corrélation automatique avec les attaques
- Niveau de confiance et scoring
- TTPs (Tactics, Techniques, Procedures)

**Vulnerability** - Gestion des vulnérabilités
- Base de données CVE
- Tracking des exploits et patchs
- Liaison avec les attaques exploitant les vulnérabilités
- Identification des systèmes affectés

**AuditLog** - Journal d'audit
- Tracking complet de toutes les actions
- Traçabilité des modifications
- Conformité et forensics
- Historique détaillé par utilisateur

#### 2️⃣ **Controllers Layer**

Contrôleurs RESTful pour chaque entité :
- **AttackController** - CRUD + recherche avancée + statistiques
- **IPController** - Gestion IPs + enrichissement + blacklist
- **SourceController** - Configuration + synchronisation
- **UserController** - Authentification + gestion utilisateurs
- **ReportController** - Génération + export + planification
- **AlertController** - Gestion alertes + notifications
- **DashboardController** - Agrégations + visualisations

#### 3️⃣ **Services Layer**

Services métier avancés :

- **AnalyticsService** - Analyses statistiques avancées, détection de patterns, prédictions
- **ThreatIntelService** - Enrichissement des données, corrélation d'incidents
- **ExternalAPIService** - Intégration avec APIs tierces (VirusTotal, AbuseIPDB, Shodan, OTX)
- **NotificationService** - Notifications multi-canaux (email, SMS, push)
- **DataSyncService** - Synchronisation, déduplication, validation
- **ExportService** - Export vers multiples formats avec visualisations
- **AuthService** - JWT, hashing, gestion sessions

#### 4️⃣ **Utilities Layer**

Utilitaires transversaux :
- **ValidationUtil** - Validation des données (IP, email, dates, etc.)
- **LoggerUtil** - Logging multi-niveaux
- **CacheUtil** - Cache en mémoire pour performances
- **ConfigUtil** - Gestion centralisée de la configuration

### Relations clés

```
Attack -----> User (reported_by)
Attack -----> IP (source_ip)
Attack -----> Attack[] (related_attacks)
IP -----> Attack[] (attacks)
Alert -----> Attack (related_attack)
Alert -----> IP (related_ip)
Report -----> Attack[] (attacks_included)
ThreatIntelligence <-----> Attack[] (correlation)
Vulnerability <-----> Attack[] (exploitation)
```

---

## 👥 Diagramme de Cas d'Utilisation

### 5 Acteurs principaux

1. **Administrateur Système** (rouge)
   - Droits complets sur le système
   - Gestion des utilisateurs et permissions
   - Configuration des sources de données
   - Accès aux logs d'audit

2. **Analyste Sécurité** (turquoise)
   - Gestion quotidienne des incidents
   - Analyses approfondies
   - Création de rapports
   - Gestion des alertes et threat intelligence

3. **Utilisateur Standard** (gris)
   - Consultation des incidents
   - Création d'incidents basiques
   - Accès au dashboard
   - Gestion de son compte

4. **API Externe** (vert)
   - VirusTotal - Analyse malwares
   - AbuseIPDB - Réputation IPs
   - Shodan - Scan réseau
   - OTX AlienVault - Threat intelligence

5. **Système de Synchronisation** (rose)
   - Synchronisation automatique des sources
   - Déduplication des données
   - Planification des rapports
   - Envoi automatique des notifications

### 10 Packages fonctionnels

1. **Gestion des Incidents** (15 use cases)
   - CRUD complet
   - Recherche et filtrage avancés
   - Import/Export en masse
   - Gestion des preuves et mitigations

2. **Gestion des IPs Suspectes** (9 use cases)
   - Tracking complet des IPs
   - Enrichissement via APIs externes
   - Blacklisting automatique
   - Calcul de scores de menace

3. **Analyse et Statistiques** (10 use cases)
   - Dashboard interactif
   - Analyses de tendances
   - Détection de patterns
   - Prédictions basées sur l'IA
   - Calcul de scores de risque

4. **Rapports et Export** (9 use cases)
   - Génération personnalisée
   - Multi-formats (PDF, CSV, Excel, JSON)
   - Planification automatique
   - Partage sécurisé

5. **Alertes et Notifications** (9 use cases)
   - Alertes configurables
   - Multi-canaux (email, SMS, push)
   - Workflow d'escalade
   - Accusé de réception

6. **Gestion des Utilisateurs** (10 use cases)
   - Authentification sécurisée
   - RBAC (Role-Based Access Control)
   - Gestion des permissions
   - Audit trail complet

7. **Intelligence des Menaces** (7 use cases)
   - Base de données IOCs
   - Corrélation avec attaques
   - Tracking des TTPs
   - Suivi des acteurs malveillants

8. **Gestion des Vulnérabilités** (6 use cases)
   - Base CVE
   - Tracking exploits et patchs
   - Identification systèmes affectés
   - Liaison avec attaques

9. **Sources de Données** (8 use cases)
   - Configuration multi-sources
   - Synchronisation automatique
   - Validation et transformation
   - Déduplication

10. **Visualisation** (6 use cases)
    - Cartes géographiques
    - Graphiques statistiques
    - Timeline d'attaques
    - Dashboard personnalisable

### Relations importantes

#### Extensions (`<<extend>>`)
- UC5 (Recherche) étend avec filtres (UC6, UC7, UC8, UC9)
- UC50 (Créer alerte) étend avec notifications (UC56, UC57, UC58)
- Modifications utilisateurs étendent vers logs d'audit

#### Inclusions (`<<include>>`)
- Toutes les opérations critiques incluent authentification (UC60)
- Enrichissement IP inclut géolocalisation et WHOIS
- Synchronisation inclut validation et déduplication
- Analyses avancées incluent corrélations

---

## 🗄️ Structure de la Base de Données

### Collections MongoDB

| Collection | Documents estimés | Index recommandés |
|-----------|-------------------|-------------------|
| attacks | 100,000+ | type, severity, date, source_ip, target_country |
| ips | 50,000+ | ip_address, threat_score, is_blacklisted |
| sources | 10-50 | name, type, is_active |
| users | 100-1,000 | username, email, role |
| reports | 1,000+ | generated_by, generated_at, type |
| alerts | 10,000+ | severity, acknowledged, triggered_at |
| threat_intelligence | 50,000+ | indicator, indicator_type, is_active |
| vulnerabilities | 200,000+ | cve_id, cvss_score, published_date |
| audit_logs | 1,000,000+ | user_id, timestamp, action |

### Index MongoDB recommandés

```javascript
// Attacks
db.attacks.createIndex({ "date": -1 });
db.attacks.createIndex({ "type": 1, "severity": 1 });
db.attacks.createIndex({ "source_ip": 1 });
db.attacks.createIndex({ "target_country": 1 });
db.attacks.createIndex({ "status": 1 });
db.attacks.createIndex({ "tags": 1 });

// IPs
db.ips.createIndex({ "ip_address": 1 }, { unique: true });
db.ips.createIndex({ "threat_score": -1 });
db.ips.createIndex({ "is_blacklisted": 1 });
db.ips.createIndex({ "country": 1 });

// Users
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });

// Alerts
db.alerts.createIndex({ "triggered_at": -1 });
db.alerts.createIndex({ "acknowledged": 1, "severity": 1 });

// ThreatIntelligence
db.threat_intelligence.createIndex({ "indicator": 1 }, { unique: true });
db.threat_intelligence.createIndex({ "indicator_type": 1 });
db.threat_intelligence.createIndex({ "is_active": 1 });

// Vulnerabilities
db.vulnerabilities.createIndex({ "cve_id": 1 }, { unique: true });
db.vulnerabilities.createIndex({ "cvss_score": -1 });

// AuditLogs
db.audit_logs.createIndex({ "timestamp": -1 });
db.audit_logs.createIndex({ "user_id": 1, "timestamp": -1 });
db.audit_logs.createIndex({ "entity_type": 1, "entity_id": 1 });
```

### Requêtes d'agrégation complexes

#### Top 10 pays les plus attaqués (30 derniers jours)
```javascript
db.attacks.aggregate([
  {
    $match: {
      date: { 
        $gte: new Date(Date.now() - 30*24*60*60*1000) 
      }
    }
  },
  {
    $group: {
      _id: "$target_country",
      total_attacks: { $sum: 1 },
      avg_severity: { $avg: "$severity_score" },
      total_impact: { $sum: "$financial_impact" }
    }
  },
  {
    $sort: { total_attacks: -1 }
  },
  {
    $limit: 10
  }
]);
```

#### IPs les plus dangereuses avec détails
```javascript
db.ips.aggregate([
  {
    $match: { 
      threat_score: { $gte: 70 } 
    }
  },
  {
    $lookup: {
      from: "attacks",
      localField: "_id",
      foreignField: "source_ip",
      as: "attack_history"
    }
  },
  {
    $project: {
      ip_address: 1,
      country: 1,
      threat_score: 1,
      attack_count: { $size: "$attack_history" },
      last_report: 1
    }
  },
  {
    $sort: { threat_score: -1 }
  },
  {
    $limit: 20
  }
]);
```

#### Tendances d'attaques par mois
```javascript
db.attacks.aggregate([
  {
    $group: {
      _id: {
        year: { $year: "$date" },
        month: { $month: "$date" },
        type: "$type"
      },
      count: { $sum: 1 }
    }
  },
  {
    $sort: {
      "_id.year": -1,
      "_id.month": -1,
      "count": -1
    }
  }
]);
```

---

## 📈 Volumétrie estimée

Pour une utilisation en production (2-3 ans) :

| Métrique | Valeur estimée |
|----------|----------------|
| **Total documents** | ~1.5 million |
| **Taille DB** | 5-10 GB |
| **Lectures/jour** | 100,000+ requêtes |
| **Écritures/jour** | 5,000-10,000 documents |
| **APIs externes** | 4-6 sources actives |
| **Utilisateurs** | 50-200 utilisateurs |

---

## 🔐 Considérations de sécurité

### Données sensibles
- Encryption at rest pour MongoDB
- Hashing bcrypt pour mots de passe (cost factor 12)
- JWT avec expiration courte (15 min access, 7 jours refresh)
- Clés API chiffrées dans la configuration

### RBAC (Role-Based Access Control)
```javascript
roles = {
  'admin': ['*'],  // Tous les droits
  'analyst': [
    'attacks:read', 'attacks:write', 'attacks:update',
    'ips:read', 'ips:write',
    'reports:read', 'reports:write',
    'alerts:read', 'alerts:write'
  ],
  'user': [
    'attacks:read', 'attacks:write',
    'dashboard:read',
    'reports:read'
  ],
  'viewer': [
    'attacks:read',
    'dashboard:read'
  ]
}
```

---

**Dernière mise à jour :** Octobre 2025
**Version :** 1.0

