# 🕵️ Ingestion Automatique d'Incidents via APIs de Threat Intelligence

## 📋 Vue d'ensemble

Le système supporte maintenant **deux modes de création d'incidents** :

1. **Mode Manuel** : Les utilisateurs créent des incidents manuellement via l'interface
2. **Mode Automatique** : Les incidents sont créés automatiquement depuis des APIs de Threat Intelligence

## 🎯 Fonctionnalités

### ✅ Ce qui est implémenté

- **Intégration avec plusieurs APIs de Threat Intelligence** :
  - VirusTotal
  - AbuseIPDB
  - Shodan
  - OTX (AlienVault Open Threat Exchange)
  - APIs personnalisées (via configuration)

- **Synchronisation automatique** :
  - Synchronisation périodique configurable
  - Synchronisation manuelle à la demande
  - Gestion des erreurs et retry automatique

- **Transformation et mapping des données** :
  - Transformation automatique des données API vers le format standard
  - Mapping personnalisable par source
  - Déduplication automatique

- **Enrichissement automatique** :
  - Enrichissement des IPs avec toutes les sources disponibles
  - Calcul automatique des scores de menace
  - Géolocalisation et informations WHOIS

## 🚀 Utilisation

### 1. Configuration des clés API

Ajoutez vos clés API dans le fichier `.env` :

```env
# APIs de Threat Intelligence
VIRUSTOTAL_API_KEY=votre_cle_virustotal
ABUSEIPDB_API_KEY=votre_cle_abuseipdb
SHODAN_API_KEY=votre_cle_shodan
OTX_API_KEY=votre_cle_otx
```

### 2. Créer une source de Threat Intelligence

#### Via l'API REST

```bash
POST /api/sources
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "AbuseIPDB Feed",
  "display_name": "AbuseIPDB Threat Intelligence Feed",
  "type": "API",
  "api_endpoint": "https://api.abuseipdb.com/api/v2/blacklist",
  "api_key": "YOUR_API_KEY",
  "authentication_method": "API_KEY",
  "sync_enabled": true,
  "sync_interval": 3600,
  "configuration": {
    "default_params": {
      "confidenceMinimum": 75,
      "limit": 10000
    },
    "timeout": 30000
  },
  "data_mapping": {
    "source_ip": "ipAddress",
    "type": "category",
    "severity": "abuseConfidenceScore",
    "description": "description",
    "date": "lastReportedAt"
  }
}
```

#### Exemple de configuration pour VirusTotal

```json
{
  "name": "VirusTotal Intelligence",
  "type": "API",
  "api_endpoint": "https://www.virustotal.com/api/v3/intelligence/search",
  "api_key": "YOUR_VIRUSTOTAL_API_KEY",
  "authentication_method": "API_KEY",
  "sync_enabled": true,
  "sync_interval": 7200,
  "configuration": {
    "headers": {
      "x-apikey": "YOUR_VIRUSTOTAL_API_KEY"
    },
    "default_params": {
      "query": "type:ip tag:malware"
    }
  }
}
```

### 3. Démarrer l'ingestion automatique

#### Option A : Script dédié (recommandé)

```bash
# Démarrer avec l'intervalle par défaut (60 minutes)
node Backend/scripts/start-automatic-ingestion.js

# Démarrer avec un intervalle personnalisé (30 minutes)
node Backend/scripts/start-automatic-ingestion.js --interval 30
```

#### Option B : Intégration dans server.js

Ajoutez dans `Backend/server.js` après la connexion à MongoDB :

```javascript
const threatIntelIngestionService = require('./services/threatIntelIngestionService');

// Démarrer l'ingestion automatique (60 minutes par défaut)
if (process.env.AUTO_INGESTION_ENABLED === 'true') {
  threatIntelIngestionService.startAutomaticIngestion(60);
}
```

Puis dans `.env` :
```env
AUTO_INGESTION_ENABLED=true
```

### 4. Synchronisation manuelle

#### Synchroniser une source spécifique

```bash
POST /api/sources/:id/sync
Authorization: Bearer YOUR_TOKEN
```

#### Synchroniser toutes les sources

```bash
POST /api/sources/sync/all
Authorization: Bearer YOUR_TOKEN
```

### 5. Consulter les statistiques

#### Statistiques d'ingestion

```bash
GET /api/sources/stats/ingestion
Authorization: Bearer YOUR_TOKEN
```

Réponse :
```json
{
  "totalSources": 5,
  "activeSources": 4,
  "totalSyncs": 120,
  "successfulSyncs": 115,
  "failedSyncs": 5,
  "totalRecordsCollected": 15420,
  "totalAutoIncidents": 1234,
  "lastSync": "2025-01-15T10:30:00Z"
}
```

#### Sources actives

```bash
GET /api/sources/stats/active
Authorization: Bearer YOUR_TOKEN
```

## 🔧 Configuration avancée

### Mapping personnalisé des données

Le champ `data_mapping` permet de mapper les champs de l'API vers le format standard :

```json
{
  "data_mapping": {
    "source_ip": "ip_address",
    "target_country": "target.country",
    "type": "threat_type",
    "severity": "risk_score",
    "description": "summary",
    "date": "timestamp",
    "tags": "categories"
  }
}
```

### Filtres

Vous pouvez configurer des filtres pour ne récupérer que certains types de menaces :

```json
{
  "filters": {
    "min_confidence_score": 75,
    "countries": ["US", "CN", "RU"],
    "categories": [1, 2, 3]
  }
}
```

### Gestion des erreurs

Le système gère automatiquement :
- **Retry automatique** : 3 tentatives avec backoff exponentiel
- **Désactivation automatique** : Si une source échoue 5 fois consécutivement, elle est désactivée
- **Logging** : Toutes les erreurs sont loggées dans AuditLog

## 📊 Format des données transformées

Les données des APIs sont transformées en incidents avec le format suivant :

```javascript
{
  source_ip: "185.122.54.90",
  target_country: "Morocco",
  type: "Phishing", // Mappé depuis le type de l'API
  severity: "High", // Mappé depuis le score de l'API
  description: "Threat detected from 185.122.54.90",
  date: ISODate("2025-01-15T10:30:00Z"),
  tags: ["malware", "phishing"],
  threat_actor: "APT28",
  confidence_level: 85,
  source: "API Sync", // Identifie les incidents créés automatiquement
  source_reliability: "B",
  status: "Detected",
  processed: false,
  enriched: false
}
```

## 🔍 Déduplication

Le système évite les doublons en vérifiant :
- Même IP source
- Même type d'attaque
- Dans une fenêtre de 24 heures

## 🎨 Exemples d'utilisation

### Exemple 1 : Configuration AbuseIPDB

```javascript
{
  "name": "AbuseIPDB Blacklist",
  "type": "API",
  "api_endpoint": "https://api.abuseipdb.com/api/v2/blacklist",
  "api_key": "YOUR_KEY",
  "authentication_method": "API_KEY",
  "sync_enabled": true,
  "sync_interval": 3600,
  "configuration": {
    "default_params": {
      "confidenceMinimum": 75,
      "limit": 10000
    }
  },
  "data_mapping": {
    "source_ip": "ipAddress",
    "type": "category",
    "severity": "abuseConfidenceScore",
    "date": "lastReportedAt"
  }
}
```

### Exemple 2 : Synchronisation manuelle via API

```bash
# 1. Créer la source
curl -X POST http://localhost:5000/api/sources \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @source-config.json

# 2. Synchroniser immédiatement
curl -X POST http://localhost:5000/api/sources/SOURCE_ID/sync \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Vérifier les statistiques
curl -X GET http://localhost:5000/api/sources/stats/ingestion \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🛠️ Dépannage

### La synchronisation ne fonctionne pas

1. **Vérifier les clés API** : Assurez-vous que les clés API sont correctement configurées dans `.env`
2. **Vérifier la configuration de la source** : Vérifiez que `sync_enabled` est à `true` et `is_active` est à `true`
3. **Vérifier les logs** : Consultez les logs du serveur pour voir les erreurs détaillées
4. **Tester la connexion** : Testez manuellement la synchronisation via l'API

### Les incidents ne sont pas créés

1. **Vérifier le mapping** : Assurez-vous que le `data_mapping` correspond à la structure de l'API
2. **Vérifier les filtres** : Les filtres peuvent exclure certaines données
3. **Vérifier la déduplication** : Les incidents peuvent être ignorés s'ils sont des doublons

### Rate limiting

Si vous rencontrez des erreurs de rate limiting :
- Augmentez `sync_interval` pour réduire la fréquence
- Contactez le fournisseur de l'API pour augmenter votre quota
- Utilisez plusieurs clés API en rotation

## 📝 Notes importantes

- Les incidents créés automatiquement ont `source: "API Sync"` pour les distinguer des incidents manuels
- Les IPs sont automatiquement enrichies lors de la création des incidents
- Le système gère automatiquement les erreurs et désactive les sources problématiques
- Toutes les actions sont loggées dans AuditLog pour la traçabilité

## 🔐 Sécurité

- Les clés API sont stockées dans `.env` (ne jamais commiter ce fichier)
- En production, utilisez un gestionnaire de secrets (AWS Secrets Manager, HashiCorp Vault, etc.)
- Les clés API dans la base de données devraient être chiffrées

## 📚 Ressources

- [VirusTotal API Documentation](https://developers.virustotal.com/reference)
- [AbuseIPDB API Documentation](https://docs.abuseipdb.com/)
- [Shodan API Documentation](https://developer.shodan.io/)
- [OTX API Documentation](https://otx.alienvault.com/api)
