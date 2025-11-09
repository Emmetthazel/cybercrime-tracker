# 🔗 Relations et Traitements des Données - Cybercrime Tracker

## 📋 Vue d'ensemble

Ce document décrit **quelles données sont traitées ensemble** dans le système de tracking des cyberattaques. Les données sont organisées en **9 collections MongoDB** qui sont **liées et agrégées** pour fournir des analyses complètes.

---

## 🔄 Relations principales entre les données

### 1️⃣ **Attacks (Attaques) ↔ IPs (Adresses IP)**

**Relation :** Les attaques sont liées aux adresses IP sources qui les ont générées.

#### Données traitées ensemble :
- **Dans Attacks :**
  - `source_ip`: Adresse IP source (ex: "185.122.54.90")
  - `source_ip_ref`: Référence ObjectId vers la collection IPs
  - `source_country`: Pays d'origine
  - `source_asn`: Numéro ASN
  - `source_isp`: Fournisseur d'accès

- **Dans IPs :**
  - `ip_address`: Adresse IP unique
  - `attacks`: Tableau de références vers les attaques liées
  - `attack_count`: Nombre d'attaques associées
  - `attack_types`: Types d'attaques observés depuis cette IP
  - `threat_score`: Score de menace calculé basé sur les attaques

**Résultat :** Pour chaque IP dangereuse, on obtient la liste des 10 attaques les plus récentes associées.

---

### 2️⃣ **Attacks (Attaques) ↔ Users (Utilisateurs)**

**Relation :** Les attaques sont liées aux utilisateurs qui les ont rapportées, assignées ou vérifiées.

#### Données traitées ensemble :
- **Dans Attacks :**
  - `reported_by`: ObjectId de l'utilisateur qui a rapporté l'attaque
  - `assigned_to`: ObjectId de l'utilisateur assigné à l'investigation
  - `verified_by`: ObjectId de l'utilisateur qui a vérifié l'attaque
  - `mitigation_actions[].performed_by`: Utilisateur qui a effectué l'action

- **Dans Users :**
  - `statistics.attacks_created`: Nombre d'attaques créées par l'utilisateur
  - `statistics.attacks_resolved`: Nombre d'attaques résolues
  - `statistics.average_response_time`: Temps moyen de réponse

**Résultat :** Pour chaque analyste, on obtient le nombre d'attaques traitées, la sévérité moyenne et le temps de réponse moyen.

---

### 3️⃣ **Attacks (Attaques) ↔ Sources (Sources de données)**

**Relation :** Les attaques proviennent de différentes sources (API, manuel, webhook).

#### Données traitées ensemble :
- **Dans Attacks :**
  - `source`: Type de source ("Manual Report", "API Sync", "Automated Detection")
  - `source_reliability`: Fiabilité de la source (A, B, C)

- **Dans Sources :**
  - `name`: Nom de la source (ex: "AbuseIPDB", "VirusTotal")
  - `records_collected`: Nombre d'enregistrements collectés
  - `last_sync`: Date de dernière synchronisation
  - `sync_status`: Statut de la synchronisation

**Résultat :** Statistiques d'attaques groupées par source avec les détails de chaque source.

---

### 4️⃣ **IPs (Adresses IP) ↔ External APIs (VirusTotal, AbuseIPDB, Shodan)**

**Relation :** Les IPs sont enrichies avec des données provenant d'APIs externes.

#### Données traitées ensemble :
- **Dans IPs :**
  - `virustotal_data`: Données VirusTotal
    - `malicious`: Nombre de détections malveillantes
    - `suspicious`: Nombre de détections suspectes
    - `reputation`: Score de réputation
  - `abuseipdb_data`: Données AbuseIPDB
    - `abuse_confidence_score`: Score de confiance d'abus
    - `total_reports`: Nombre total de rapports
    - `categories`: Catégories d'abus
  - `shodan_data`: Données Shodan
    - `hostnames`: Noms d'hôtes associés
    - `tags`: Tags de menace
    - `vulns`: Vulnérabilités détectées

**Résultat :** IPs avec un score de menace agrégé calculé à partir de toutes les sources externes.

---

### 5️⃣ **Attacks (Attaques) ↔ Related Attacks (Attaques liées)**

**Relation :** Les attaques peuvent être liées entre elles pour détecter des campagnes coordonnées.

#### Données traitées ensemble :
- **Dans Attacks :**
  - `related_attacks`: Tableau d'ObjectId vers d'autres attaques
  - `campaign_id`: Identifiant de campagne
  - `threat_actor`: Acteur de menace
  - `attack_pattern`: Pattern MITRE ATT&CK

**Résultat :** Groupes d'attaques similaires qui forment potentiellement une campagne coordonnée.

---

### 6️⃣ **Attacks (Attaques) ↔ Vulnerabilities (Vulnérabilités)**

**Relation :** Les attaques peuvent exploiter des vulnérabilités connues (CVE).

#### Données traitées ensemble :
- **Dans Attacks :**
  - `related_vulnerabilities`: Tableau d'ObjectId vers la collection Vulnerabilities
  - `cvss_score`: Score CVSS de l'attaque
  - `attack_pattern`: Pattern d'attaque MITRE

- **Dans Vulnerabilities :**
  - `cve_id`: Identifiant CVE (ex: "CVE-2021-44228")
  - `cvss_score`: Score CVSS
  - `exploited_in_attacks`: Nombre d'attaques exploitant cette vulnérabilité

**Résultat :** Liste des vulnérabilités les plus exploitées avec le nombre d'attaques et la sévérité moyenne.

---

### 7️⃣ **Attacks (Attaques) ↔ Threat Intelligence (Indicateurs de menace)**

**Relation :** Les attaques sont liées à des indicateurs de menace (IOCs).

#### Données traitées ensemble :
- **Dans Attacks :**
  - `related_indicators`: Tableau d'ObjectId vers ThreatIntelligence
  - `forensics_data.malware_hash`: Hash du malware
  - `forensics_data.c2_servers`: Serveurs de commande et contrôle

- **Dans ThreatIntelligence :**
  - `indicator`: Valeur de l'indicateur (IP, domaine, hash)
  - `indicator_type`: Type (ip, domain, hash, url)
  - `threat_type`: Type de menace
  - `is_active`: Indicateur actif ou non

**Résultat :** Indicateurs de menace les plus fréquents dans les attaques critiques.

---

### 8️⃣ **Attacks (Attaques) + IPs (IPs) + Countries (Pays) - Analyse géographique**

**Relation :** Analyse des attaques par pays source et pays cible.

#### Données traitées ensemble :
- **Dans Attacks :**
  - `source_country`: Pays d'origine de l'attaque
  - `target_country`: Pays ciblé
  - `target_sector`: Secteur ciblé (Education, Finance, etc.)

- **Dans IPs :**
  - `country`: Pays de l'adresse IP
  - `geolocation`: Coordonnées géographiques (longitude, latitude)

**Résultat :** 
- Top 10 pays sources d'attaques
- Top 10 pays cibles
- Flux d'attaques entre pays (source → cible)

---

### 9️⃣ **Dashboard - Agrégation multi-collections**

**Relation :** Le dashboard combine toutes les collections pour une vue d'ensemble.

#### Données traitées ensemble :
- **Attacks** : Statistiques d'attaques
- **IPs** : IPs les plus dangereuses
- **Users** : Performance des analystes
- **Alerts** : Alertes actives
- **Reports** : Rapports générés

**Résultat :** Vue d'ensemble complète du système avec toutes les métriques importantes en une seule requête.

---

## 🎯 Cas d'utilisation principaux

### 1. **Analyse d'une IP suspecte**
- **Données combinées :** IPs + Attacks + External APIs
- **Résultat :** Profil complet de l'IP avec historique d'attaques et scores de menace

### 2. **Détection de campagnes**
- **Données combinées :** Attacks + Attacks (related) + IPs
- **Résultat :** Groupes d'attaques similaires formant une campagne

### 3. **Dashboard analytique**
- **Données combinées :** Attacks + IPs + Users + Alerts
- **Résultat :** Vue d'ensemble avec toutes les métriques clés

### 4. **Enrichissement d'IP**
- **Données combinées :** IPs + VirusTotal + AbuseIPDB + Shodan
- **Résultat :** IP enrichie avec scores agrégés de toutes les sources

### 5. **Rapport d'analyste**
- **Données combinées :** Attacks + Users
- **Résultat :** Statistiques de performance par analyste
