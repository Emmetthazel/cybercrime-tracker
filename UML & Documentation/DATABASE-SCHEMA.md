# 🗄️ Schéma Détaillé de la Base de Données MongoDB
# Cybercrime Tracker

## 📋 Vue d'ensemble

Cette base de données MongoDB est conçue pour gérer un volume important d'incidents de cybersécurité avec des capacités d'analyse avancées et d'enrichissement automatique des données.

### Statistiques prévues
- **9 collections principales**
- **Volumétrie estimée : 1.5+ million de documents**
- **Taille DB : 5-10 GB**
- **Requêtes/jour : 100,000+**

---

## 📊 Collections détaillées

### 1️⃣ Collection : `attacks`

**Description :** Collection centrale stockant tous les incidents de cybersécurité.

**Volumétrie estimée :** 100,000+ documents

#### Schéma complet

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  
  // Informations de base
  type: "Phishing",  // Enum: Phishing, DDoS, Ransomware, Malware, SQL Injection, XSS, etc.
  subtype: "Spear Phishing",  // Sous-catégorie spécifique
  
  // Source de l'attaque
  source_ip: "185.122.54.90",
  source_ip_ref: ObjectId("..."),  // Référence vers collection IPs
  source_country: "Russia",
  source_asn: "AS12345",
  source_isp: "Evil Corp ISP",
  
  // Cible de l'attaque
  target_country: "Morocco",
  target_org: "EMSI",
  target_sector: "Education",  // Finance, Healthcare, Government, etc.
  target_systems: [
    "mail.emsi.ma",
    "portal.emsi.ma"
  ],
  target_ips: ["192.168.1.100"],
  
  // Détails temporels
  date: ISODate("2025-10-19T12:30:00Z"),
  detected_at: ISODate("2025-10-19T12:35:00Z"),
  duration_seconds: 3600,
  timezone: "Africa/Casablanca",
  
  // Gravité et impact
  severity: "High",  // Low, Medium, High, Critical
  severity_score: 8.5,  // 0-10
  cvss_score: 8.3,
  confidence_level: 95,  // Pourcentage de confiance
  
  // Impact quantifié
  data_loss: 5000,  // En Mo
  financial_impact: 50000,  // En USD
  affected_users: 1200,
  downtime_minutes: 240,
  
  // Description et contexte
  description: "Sophisticated phishing campaign targeting employee credentials using social engineering techniques.",
  attack_vector: "Email with malicious attachment",
  attack_pattern: "MITRE ATT&CK: T1566.001",
  
  // Statut et workflow
  status: "Mitigated",  // Detected, Under Investigation, Contained, Mitigated, Resolved
  priority: "High",
  assigned_to: ObjectId("..."),  // Référence vers User
  
  // Reporting
  reported_by: ObjectId("..."),  // Référence vers User
  reported_at: ISODate("2025-10-19T12:40:00Z"),
  verified: true,
  verified_by: ObjectId("..."),
  
  // Actions de mitigation
  mitigation_actions: [
    {
      action: "Blocked sender IP",
      performed_by: ObjectId("..."),
      performed_at: ISODate("2025-10-19T12:50:00Z"),
      effectiveness: "High"
    },
    {
      action: "Password reset for affected users",
      performed_by: ObjectId("..."),
      performed_at: ISODate("2025-10-19T13:00:00Z"),
      effectiveness: "Medium"
    }
  ],
  
  // Preuves et forensics
  evidence_files: [
    "/evidence/attack_123/email_header.txt",
    "/evidence/attack_123/malicious_file.exe",
    "/evidence/attack_123/network_logs.pcap"
  ],
  screenshots: [
    "/evidence/attack_123/phishing_page.png"
  ],
  forensics_data: {
    malware_hash: "d41d8cd98f00b204e9800998ecf8427e",
    c2_servers: ["malicious-c2.com", "185.122.54.91"],
    exfiltration_detected: true,
    persistence_mechanisms: ["Registry modification", "Scheduled task"]
  },
  
  // Classification et tags
  tags: ["email", "social_engineering", "credential_theft"],
  categories: ["External Threat", "Data Breach"],
  threat_actor: "APT28",
  campaign_id: "Campaign_2025_Q4",
  
  // Relations
  related_attacks: [
    ObjectId("..."),
    ObjectId("...")
  ],
  related_vulnerabilities: [
    ObjectId("...")  // Référence vers Vulnerability
  ],
  related_indicators: [
    ObjectId("...")  // Référence vers ThreatIntelligence
  ],
  
  // Métadonnées
  source: "Manual Report",  // Manual Report, API Sync, Automated Detection
  source_reliability: "A",  // A (Reliable), B (Usually Reliable), C (Fairly Reliable)
  
  // Compliance et légal
  gdpr_relevant: true,
  law_enforcement_notified: true,
  notification_required: true,
  breach_notification_date: ISODate("2025-10-20T00:00:00Z"),
  
  // Timestamps
  created_at: ISODate("2025-10-19T12:40:00Z"),
  updated_at: ISODate("2025-10-19T14:30:00Z"),
  
  // Métadonnées de traitement
  processed: true,
  enriched: true,
  last_enrichment: ISODate("2025-10-19T13:00:00Z")
}
```

#### Index recommandés

```javascript
db.attacks.createIndex({ "date": -1 });
db.attacks.createIndex({ "type": 1, "severity": 1 });
db.attacks.createIndex({ "source_ip": 1 });
db.attacks.createIndex({ "target_country": 1 });
db.attacks.createIndex({ "status": 1 });
db.attacks.createIndex({ "tags": 1 });
db.attacks.createIndex({ "threat_actor": 1 });
db.attacks.createIndex({ "campaign_id": 1 });
db.attacks.createIndex({ "created_at": -1 });
db.attacks.createIndex({ "severity_score": -1 });

// Index composé pour requêtes complexes
db.attacks.createIndex({ 
  "target_country": 1, 
  "type": 1, 
  "date": -1 
});

// Index texte pour recherche full-text
db.attacks.createIndex({ 
  "description": "text", 
  "attack_vector": "text",
  "tags": "text"
});

// Index géospatial si nécessaire
db.attacks.createIndex({ "geolocation": "2dsphere" });
```

---

### 2️⃣ Collection : `ips`

**Description :** Tracking complet des adresses IP suspectes avec enrichissement automatique.

**Volumétrie estimée :** 50,000+ documents

#### Schéma complet

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439012"),
  
  // Identification
  ip_address: "185.122.54.90",  // Unique
  ip_version: 4,  // IPv4 ou IPv6
  
  // Géolocalisation
  country: "Russia",
  country_code: "RU",
  city: "Moscow",
  region: "Moscow Oblast",
  postal_code: "101000",
  geolocation: {
    type: "Point",
    coordinates: [37.6173, 55.7558]  // [longitude, latitude]
  },
  
  // Informations réseau
  isp: "Evil Corp ISP",
  organization: "Malicious Hosting Ltd",
  asn: "AS12345",
  asn_name: "EVIL-AS",
  
  // Tracking et statistiques
  reported_count: 45,
  attack_count: 38,
  first_seen: ISODate("2024-01-15T08:00:00Z"),
  last_report: ISODate("2025-10-18T22:00:00Z"),
  last_activity: ISODate("2025-10-19T12:30:00Z"),
  
  // Scores et réputation
  threat_score: 85,  // 0-100
  reputation_score: 15,  // 0-100 (inverse du threat_score)
  risk_level: "High",  // Low, Medium, High, Critical
  
  // Blacklist
  is_blacklisted: true,
  blacklisted_at: ISODate("2025-05-10T00:00:00Z"),
  blacklist_sources: [
    "AbuseIPDB",
    "Spamhaus",
    "Internal Blacklist"
  ],
  blacklist_reason: "Multiple phishing attacks",
  
  // Données WHOIS
  whois_data: {
    registrar: "Evil Registrar",
    created_date: ISODate("2020-01-01T00:00:00Z"),
    updated_date: ISODate("2024-12-01T00:00:00Z"),
    expiry_date: ISODate("2026-01-01T00:00:00Z"),
    nameservers: ["ns1.evil.com", "ns2.evil.com"],
    registrant: "Privacy Protected"
  },
  
  // Domaines associés
  associated_domains: [
    "malicious-site.com",
    "phishing-page.ru",
    "fake-bank.net"
  ],
  
  // Menaces associées
  malware_families: [
    "Emotet",
    "TrickBot",
    "Cobalt Strike"
  ],
  attack_types: [
    "Phishing",
    "Malware Distribution",
    "C2 Communication"
  ],
  
  // Attaques liées
  attacks: [
    ObjectId("..."),
    ObjectId("...")
  ],
  
  // Informations techniques
  open_ports: [80, 443, 8080, 3389],
  services: [
    {
      port: 80,
      service: "HTTP",
      version: "nginx 1.18.0",
      banner: "nginx/1.18.0"
    },
    {
      port: 443,
      service: "HTTPS",
      version: "nginx 1.18.0",
      ssl_cert: {
        issuer: "Let's Encrypt",
        valid_from: ISODate("2025-01-01T00:00:00Z"),
        valid_to: ISODate("2025-04-01T00:00:00Z")
      }
    }
  ],
  
  // Enrichissement via APIs
  virustotal_data: {
    last_analysis_date: ISODate("2025-10-19T10:00:00Z"),
    malicious: 45,
    suspicious: 12,
    harmless: 30,
    undetected: 3,
    reputation: -500,
    url: "https://www.virustotal.com/gui/ip-address/185.122.54.90"
  },
  
  abuseipdb_data: {
    abuse_confidence_score: 100,
    total_reports: 234,
    num_distinct_users: 67,
    last_reported: ISODate("2025-10-19T08:00:00Z"),
    categories: [18, 21],  // Hacking, Phishing
    country_code: "RU"
  },
  
  shodan_data: {
    last_scan: ISODate("2025-10-15T00:00:00Z"),
    hostnames: ["evil.malicious-site.com"],
    tags: ["malware", "botnet"],
    vulns: ["CVE-2021-44228", "CVE-2023-12345"]
  },
  
  // Statut et actions
  is_active: true,
  is_tor_exit_node: false,
  is_proxy: true,
  is_vpn: false,
  
  // Notes et commentaires
  notes: "IP confirmed to be part of APT28 infrastructure. Multiple phishing campaigns originating from this address.",
  analyst_comments: [
    {
      user: ObjectId("..."),
      comment: "This IP has been used in multiple targeted attacks against educational institutions.",
      created_at: ISODate("2025-10-19T14:00:00Z")
    }
  ],
  
  // Actions entreprises
  actions_taken: [
    {
      action: "Blocked at firewall level",
      performed_by: ObjectId("..."),
      performed_at: ISODate("2025-10-19T12:45:00Z")
    },
    {
      action: "Reported to ISP",
      performed_by: ObjectId("..."),
      performed_at: ISODate("2025-10-19T13:00:00Z")
    }
  ],
  
  // Métadonnées
  created_at: ISODate("2024-01-15T08:00:00Z"),
  updated_at: ISODate("2025-10-19T14:30:00Z"),
  last_enrichment: ISODate("2025-10-19T10:00:00Z"),
  enrichment_sources: ["VirusTotal", "AbuseIPDB", "Shodan"]
}
```

#### Index recommandés

```javascript
db.ips.createIndex({ "ip_address": 1 }, { unique: true });
db.ips.createIndex({ "threat_score": -1 });
db.ips.createIndex({ "is_blacklisted": 1 });
db.ips.createIndex({ "country": 1 });
db.ips.createIndex({ "last_activity": -1 });
db.ips.createIndex({ "attack_types": 1 });
db.ips.createIndex({ "malware_families": 1 });
db.ips.createIndex({ "geolocation": "2dsphere" });
db.ips.createIndex({ "is_active": 1, "threat_score": -1 });
```

---

### 3️⃣ Collection : `sources`

**Description :** Configuration et gestion des sources de données externes.

**Volumétrie estimée :** 10-50 documents

#### Schéma complet

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439013"),
  
  // Identification
  name: "AbuseIPDB",
  display_name: "AbuseIPDB Threat Intelligence",
  type: "API",  // API, RSS, CSV, Manual, Webhook
  category: "Threat Intelligence",
  
  // Configuration API
  api_endpoint: "https://api.abuseipdb.com/api/v2",
  api_key: "encrypted_key_here",  // Chiffré
  api_version: "v2",
  authentication_method: "API_KEY",  // API_KEY, OAuth, Basic, Bearer
  
  // Paramètres de synchronisation
  sync_enabled: true,
  sync_interval: 3600,  // En secondes (1 heure)
  last_sync: ISODate("2025-10-19T09:00:00Z"),
  next_sync: ISODate("2025-10-19T10:00:00Z"),
  sync_status: "Success",  // Success, Failed, In Progress
  
  // Statistiques
  records_collected: 1520,
  total_syncs: 245,
  successful_syncs: 240,
  failed_syncs: 5,
  average_response_time: 2.3,  // En secondes
  
  // Fiabilité et qualité
  is_active: true,
  reliability_score: 95,  // 0-100
  data_quality_score: 92,
  
  // Gestion des erreurs
  error_count: 5,
  last_error: "Rate limit exceeded",
  last_error_date: ISODate("2025-10-15T14:30:00Z"),
  consecutive_errors: 0,
  max_consecutive_errors: 5,
  
  // Rate limiting
  rate_limit: 1000,  // Requêtes par jour
  rate_limit_period: "day",
  current_usage: 450,
  rate_limit_reset: ISODate("2025-10-20T00:00:00Z"),
  
  // Configuration avancée
  configuration: {
    endpoint_paths: {
      check_ip: "/check",
      report_ip: "/report",
      blacklist: "/blacklist"
    },
    default_params: {
      maxAgeInDays: 90,
      verbose: true
    },
    retry_config: {
      max_retries: 3,
      retry_delay: 5000,  // En millisecondes
      backoff_multiplier: 2
    },
    timeout: 30000,  // En millisecondes
    headers: {
      "Accept": "application/json",
      "User-Agent": "CybercrimeTracker/1.0"
    }
  },
  
  // Mapping des données
  data_mapping: {
    ip_address: "data.ipAddress",
    threat_score: "data.abuseConfidenceScore",
    country: "data.countryCode",
    reports: "data.totalReports"
  },
  
  // Filtres et transformations
  filters: {
    min_confidence_score: 50,
    countries: ["RU", "CN", "KP"],  // Si vide, tous les pays
    categories: [18, 21, 22]  // Hacking, Phishing, DDoS
  },
  
  // Coûts (si applicable)
  pricing: {
    plan: "Professional",
    cost_per_month: 49.99,
    currency: "USD",
    requests_included: 30000
  },
  
  // Webhook (si applicable)
  webhook: {
    enabled: false,
    url: "https://cybercrime-tracker.com/webhook/abuseipdb",
    secret: "encrypted_webhook_secret",
    events: ["new_report", "blacklist_update"]
  },
  
  // Documentation et support
  documentation_url: "https://docs.abuseipdb.com",
  support_email: "support@abuseipdb.com",
  terms_of_service_url: "https://www.abuseipdb.com/terms",
  
  // Métadonnées
  created_at: ISODate("2024-01-01T00:00:00Z"),
  updated_at: ISODate("2025-10-19T09:05:00Z"),
  created_by: ObjectId("..."),
  updated_by: ObjectId("...")
}
```

#### Index recommandés

```javascript
db.sources.createIndex({ "name": 1 }, { unique: true });
db.sources.createIndex({ "type": 1 });
db.sources.createIndex({ "is_active": 1 });
db.sources.createIndex({ "next_sync": 1 });
db.sources.createIndex({ "reliability_score": -1 });
```

---

### 4️⃣ Collection : `users`

**Description :** Gestion des utilisateurs avec authentification et RBAC.

**Volumétrie estimée :** 100-1,000 documents

#### Schéma complet

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439014"),
  
  // Identification
  username: "abdo_analyst",  // Unique
  email: "abdo@emsi.ma",  // Unique
  full_name: "Abdelkhalek Benabderrahman",
  
  // Authentification
  password: "$2b$12$hashed_password_here",  // Bcrypt hash
  password_last_changed: ISODate("2025-09-01T00:00:00Z"),
  password_history: [
    {
      password: "$2b$12$old_hashed_password",
      changed_at: ISODate("2025-06-01T00:00:00Z")
    }
  ],
  
  // Tokens
  api_token: "encrypted_api_token",
  api_token_created: ISODate("2025-10-01T00:00:00Z"),
  api_token_expires: ISODate("2026-10-01T00:00:00Z"),
  
  refresh_tokens: [
    {
      token: "encrypted_refresh_token",
      created_at: ISODate("2025-10-19T08:00:00Z"),
      expires_at: ISODate("2025-10-26T08:00:00Z"),
      device: "Chrome on Windows",
      ip_address: "192.168.1.100"
    }
  ],
  
  // Rôle et permissions
  role: "analyst",  // admin, analyst, user, viewer
  permissions: [
    "attacks:read",
    "attacks:write",
    "attacks:update",
    "ips:read",
    "ips:write",
    "reports:read",
    "reports:write",
    "alerts:read",
    "alerts:write"
  ],
  
  // Informations organisationnelles
  organization: "EMSI",
  department: "Cybersecurity Operations",
  job_title: "Security Analyst",
  phone: "+212-6-12-34-56-78",
  office_location: "Casablanca, Morocco",
  
  // Statut
  is_active: true,
  is_verified: true,
  is_locked: false,
  locked_until: null,
  
  // Tracking de connexion
  last_login: ISODate("2025-10-19T08:00:00Z"),
  last_login_ip: "192.168.1.100",
  login_count: 1234,
  failed_login_attempts: 0,
  last_failed_login: null,
  
  // Sécurité
  two_factor_enabled: true,
  two_factor_secret: "encrypted_2fa_secret",
  two_factor_backup_codes: [
    "encrypted_code_1",
    "encrypted_code_2"
  ],
  
  security_questions: [
    {
      question: "What was the name of your first pet?",
      answer: "hashed_answer"
    }
  ],
  
  // Préférences
  preferences: {
    language: "fr",
    timezone: "Africa/Casablanca",
    date_format: "DD/MM/YYYY",
    theme: "dark",
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true
  },
  
  // Notifications
  notification_preferences: {
    new_attack_high_severity: true,
    new_attack_critical_severity: true,
    alert_triggered: true,
    report_generated: true,
    system_updates: false,
    digest_frequency: "daily"  // real-time, hourly, daily, weekly
  },
  
  // Dashboard personnalisé
  dashboard_config: {
    layout: "grid",
    widgets: [
      {
        type: "attack_stats",
        position: { x: 0, y: 0, w: 6, h: 2 }
      },
      {
        type: "recent_incidents",
        position: { x: 6, y: 0, w: 6, h: 4 }
      }
    ]
  },
  
  // Statistiques utilisateur
  statistics: {
    attacks_created: 45,
    attacks_resolved: 38,
    reports_generated: 12,
    alerts_acknowledged: 89,
    average_response_time: 15  // En minutes
  },
  
  // Session management
  active_sessions: [
    {
      session_id: "session_123",
      device: "Chrome on Windows",
      ip_address: "192.168.1.100",
      user_agent: "Mozilla/5.0...",
      created_at: ISODate("2025-10-19T08:00:00Z"),
      last_activity: ISODate("2025-10-19T14:30:00Z")
    }
  ],
  
  // Avatar et profil
  avatar_url: "/avatars/user_123.jpg",
  bio: "Experienced security analyst specializing in threat intelligence.",
  social_links: {
    linkedin: "https://linkedin.com/in/abdo",
    twitter: "@abdo_security"
  },
  
  // Métadonnées
  created_at: ISODate("2024-06-01T00:00:00Z"),
  updated_at: ISODate("2025-10-19T08:00:00Z"),
  created_by: ObjectId("..."),  // Admin qui a créé le compte
  last_password_reset: ISODate("2025-09-01T00:00:00Z"),
  
  // Compliance
  gdpr_consent: true,
  gdpr_consent_date: ISODate("2024-06-01T00:00:00Z"),
  terms_accepted: true,
  terms_accepted_date: ISODate("2024-06-01T00:00:00Z")
}
```

#### Index recommandés

```javascript
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "is_active": 1 });
db.users.createIndex({ "organization": 1 });
db.users.createIndex({ "api_token": 1 });
db.users.createIndex({ "last_login": -1 });
```

---

## 🔍 Requêtes d'agrégation avancées

### Dashboard principal - Vue d'ensemble

```javascript
db.attacks.aggregate([
  // Statistiques des 30 derniers jours
  {
    $facet: {
      // Total des attaques par type
      attack_types: [
        {
          $match: {
            date: { $gte: new Date(Date.now() - 30*24*60*60*1000) }
          }
        },
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
            avg_severity: { $avg: "$severity_score" }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ],
      
      // Pays les plus ciblés
      targeted_countries: [
        {
          $match: {
            date: { $gte: new Date(Date.now() - 30*24*60*60*1000) }
          }
        },
        {
          $group: {
            _id: "$target_country",
            count: { $sum: 1 },
            total_impact: { $sum: "$financial_impact" }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ],
      
      // Tendances temporelles
      time_series: [
        {
          $match: {
            date: { $gte: new Date(Date.now() - 30*24*60*60*1000) }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$date" }
            },
            count: { $sum: 1 },
            critical: {
              $sum: {
                $cond: [{ $eq: ["$severity", "Critical"] }, 1, 0]
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ],
      
      // Statistiques globales
      global_stats: [
        {
          $group: {
            _id: null,
            total_attacks: { $sum: 1 },
            avg_severity: { $avg: "$severity_score" },
            total_financial_impact: { $sum: "$financial_impact" },
            avg_response_time: {
              $avg: {
                $divide: [
                  { $subtract: ["$detected_at", "$date"] },
                  1000 * 60
                ]
              }
            }
          }
        }
      ]
    }
  }
]);
```

### Top 20 IPs dangereuses avec contexte complet

```javascript
db.ips.aggregate([
  // Filtrer IPs actives et dangereuses
  {
    $match: {
      is_active: true,
      threat_score: { $gte: 70 }
    }
  },
  
  // Enrichir avec les attaques
  {
    $lookup: {
      from: "attacks",
      let: { ip_id: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ["$source_ip_ref", "$$ip_id"] }
          }
        },
        {
          $project: {
            type: 1,
            severity: 1,
            date: 1,
            target_country: 1
          }
        },
        { $sort: { date: -1 } },
        { $limit: 10 }
      ],
      as: "recent_attacks"
    }
  },
  
  // Calculer statistiques
  {
    $addFields: {
      attack_diversity: { $size: { $setUnion: "$attack_types" } },
      malware_diversity: { $size: "$malware_families" },
      days_active: {
        $divide: [
          { $subtract: ["$last_activity", "$first_seen"] },
          1000 * 60 * 60 * 24
        ]
      }
    }
  },
  
  // Trier par dangerosité
  {
    $sort: {
      threat_score: -1,
      attack_count: -1
    }
  },
  
  { $limit: 20 },
  
  // Projection finale
  {
    $project: {
      ip_address: 1,
      country: 1,
      threat_score: 1,
      attack_count: 1,
      attack_diversity: 1,
      malware_families: 1,
      is_blacklisted: 1,
      recent_attacks: 1,
      days_active: 1,
      last_activity: 1
    }
  }
]);
```

### Détection de campagnes coordonnées

```javascript
db.attacks.aggregate([
  // Attaques récentes
  {
    $match: {
      date: { $gte: new Date(Date.now() - 7*24*60*60*1000) }
    }
  },
  
  // Grouper par patterns similaires
  {
    $group: {
      _id: {
        type: "$type",
        attack_vector: "$attack_vector",
        target_sector: "$target_sector"
      },
      count: { $sum: 1 },
      attacks: { $push: "$$ROOT" },
      countries: { $addToSet: "$target_country" },
      source_ips: { $addToSet: "$source_ip" },
      date_range: {
        min: { $min: "$date" },
        max: { $max: "$date" }
      }
    }
  },
  
  // Filtrer campagnes potentielles (3+ attaques similaires)
  {
    $match: {
      count: { $gte: 3 }
    }
  },
  
  // Calculer score de corrélation
  {
    $addFields: {
      correlation_score: {
        $multiply: [
          "$count",
          { $size: "$countries" },
          10
        ]
      },
      duration_days: {
        $divide: [
          { $subtract: ["$date_range.max", "$date_range.min"] },
          1000 * 60 * 60 * 24
        ]
      }
    }
  },
  
  // Trier par score
  {
    $sort: { correlation_score: -1 }
  },
  
  { $limit: 10 }
]);
```

---

## 📈 Optimisation des performances

### Sharding strategy

Pour très grosses volumétries (10M+ documents) :

```javascript
// Activer sharding sur la collection attacks
sh.enableSharding("cybercrime_tracker");

// Shard key basée sur la date (range-based)
sh.shardCollection(
  "cybercrime_tracker.attacks",
  { "date": 1, "_id": 1 }
);

// Ou shard key basée sur un hash du pays cible (hash-based)
sh.shardCollection(
  "cybercrime_tracker.attacks",
  { "target_country": "hashed" }
);
```

### Time Series Collections (MongoDB 5.0+)

Pour la collection `attacks` :

```javascript
db.createCollection("attacks", {
  timeseries: {
    timeField: "date",
    metaField: "metadata",
    granularity: "hours"
  }
});
```

### Archivage automatique

```javascript
// Créer une collection d'archive
db.createCollection("attacks_archive");

// Migrer attaques anciennes (>2 ans)
db.attacks.aggregate([
  {
    $match: {
      date: { $lt: new Date(Date.now() - 2*365*24*60*60*1000) }
    }
  },
  { $out: "attacks_archive" }
]);

// Supprimer de la collection principale
db.attacks.deleteMany({
  date: { $lt: new Date(Date.now() - 2*365*24*60*60*1000) }
});
```

---

## 🔐 Sécurité de la base de données

### Encryption at rest

```javascript
// mongod.conf
security:
  enableEncryption: true
  encryptionKeyFile: /path/to/keyfile
```

### Role-Based Access Control

```javascript
// Créer rôle analyst
db.createRole({
  role: "analyst",
  privileges: [
    {
      resource: { db: "cybercrime_tracker", collection: "attacks" },
      actions: ["find", "insert", "update"]
    },
    {
      resource: { db: "cybercrime_tracker", collection: "ips" },
      actions: ["find", "insert", "update"]
    },
    {
      resource: { db: "cybercrime_tracker", collection: "reports" },
      actions: ["find", "insert"]
    }
  ],
  roles: []
});

// Créer utilisateur avec rôle
db.createUser({
  user: "analyst_user",
  pwd: "secure_password",
  roles: [{ role: "analyst", db: "cybercrime_tracker" }]
});
```

---

**Dernière mise à jour :** Octobre 2025  
**Version :** 1.0

