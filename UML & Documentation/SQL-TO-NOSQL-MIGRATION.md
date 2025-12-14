# SQL to NoSQL Migration Guide
## Complete Schema Mapping - Cybercrime Tracker

This document shows the complete SQL database schema (relational), its MongoDB equivalent (document-based), and Neo4j equivalent (graph-based) for all entities in the Cybercrime Tracker project.

---

## Part 1: SQL Database Schema (Before Migration)

### 1. Users Table
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    password_last_changed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role ENUM('admin', 'analyst', 'user', 'viewer') DEFAULT 'user',
    organization VARCHAR(255),
    department VARCHAR(255),
    job_title VARCHAR(255),
    phone VARCHAR(50),
    office_location VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    locked_until TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    last_login_ip VARCHAR(45),
    login_count INT DEFAULT 0,
    failed_login_attempts INT DEFAULT 0,
    last_failed_login TIMESTAMP NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    api_token VARCHAR(255),
    api_token_created TIMESTAMP NULL,
    api_token_expires TIMESTAMP NULL,
    avatar_url VARCHAR(500),
    bio TEXT,
    gdpr_consent BOOLEAN DEFAULT FALSE,
    gdpr_consent_date TIMESTAMP NULL,
    terms_accepted BOOLEAN DEFAULT FALSE,
    terms_accepted_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE user_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    permission VARCHAR(100) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_password_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    password VARCHAR(255) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_refresh_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    device VARCHAR(255),
    ip_address VARCHAR(45),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_active_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    device VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    theme ENUM('light', 'dark') DEFAULT 'light',
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    push_notifications BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_notification_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    new_attack_high_severity BOOLEAN DEFAULT TRUE,
    new_attack_critical_severity BOOLEAN DEFAULT TRUE,
    alert_triggered BOOLEAN DEFAULT TRUE,
    report_generated BOOLEAN DEFAULT FALSE,
    system_updates BOOLEAN DEFAULT FALSE,
    digest_frequency ENUM('real-time', 'hourly', 'daily', 'weekly') DEFAULT 'daily',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_statistics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    attacks_created INT DEFAULT 0,
    attacks_resolved INT DEFAULT 0,
    reports_generated INT DEFAULT 0,
    alerts_acknowledged INT DEFAULT 0,
    average_response_time INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_security_questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    question VARCHAR(255) NOT NULL,
    answer VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_social_links (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    linkedin VARCHAR(500),
    twitter VARCHAR(500),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 2. Attacks Table
```sql
CREATE TABLE attacks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('Phishing', 'DDoS', 'Ransomware', 'Malware', 'SQL Injection', 'XSS', 'Brute Force', 'Man-in-the-Middle', 'Other') NOT NULL,
    subtype VARCHAR(255),
    source_ip VARCHAR(45) NOT NULL,
    source_ip_ref INT,
    source_country VARCHAR(100),
    source_asn VARCHAR(50),
    source_isp VARCHAR(255),
    target_country VARCHAR(100) NOT NULL,
    target_org VARCHAR(255),
    target_sector ENUM('Education', 'Finance', 'Healthcare', 'Government', 'Technology', 'Other'),
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    detected_at TIMESTAMP,
    duration_seconds INT,
    timezone VARCHAR(50),
    severity ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    severity_score DECIMAL(3,1) CHECK (severity_score >= 0 AND severity_score <= 10),
    cvss_score DECIMAL(3,1) CHECK (cvss_score >= 0 AND cvss_score <= 10),
    confidence_level INT CHECK (confidence_level >= 0 AND confidence_level <= 100) DEFAULT 50,
    data_loss INT,
    financial_impact DECIMAL(15,2),
    affected_users INT,
    downtime_minutes INT,
    description TEXT NOT NULL,
    attack_vector VARCHAR(500),
    attack_pattern VARCHAR(255),
    status ENUM('Detected', 'Under Investigation', 'Contained', 'Mitigated', 'Resolved') DEFAULT 'Detected',
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    assigned_to INT,
    reported_by INT NOT NULL,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    verified_by INT,
    gdpr_relevant BOOLEAN DEFAULT FALSE,
    law_enforcement_notified BOOLEAN DEFAULT FALSE,
    notification_required BOOLEAN DEFAULT FALSE,
    breach_notification_date TIMESTAMP NULL,
    source ENUM('Manual Report', 'API Sync', 'Automated Detection') DEFAULT 'Manual Report',
    source_reliability ENUM('A', 'B', 'C') DEFAULT 'B',
    processed BOOLEAN DEFAULT FALSE,
    enriched BOOLEAN DEFAULT FALSE,
    last_enrichment TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (source_ip_ref) REFERENCES ips(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (reported_by) REFERENCES users(id),
    FOREIGN KEY (verified_by) REFERENCES users(id)
);

CREATE TABLE attack_target_systems (
    id INT PRIMARY KEY AUTO_INCREMENT,
    attack_id INT NOT NULL,
    system_name VARCHAR(255) NOT NULL,
    FOREIGN KEY (attack_id) REFERENCES attacks(id) ON DELETE CASCADE
);

CREATE TABLE attack_target_ips (
    id INT PRIMARY KEY AUTO_INCREMENT,
    attack_id INT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    FOREIGN KEY (attack_id) REFERENCES attacks(id) ON DELETE CASCADE
);

CREATE TABLE attack_mitigation_actions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    attack_id INT NOT NULL,
    action VARCHAR(500) NOT NULL,
    performed_by INT,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    effectiveness ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
    FOREIGN KEY (attack_id) REFERENCES attacks(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id)
);

CREATE TABLE attack_evidence_files (
    id INT PRIMARY KEY AUTO_INCREMENT,
    attack_id INT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    FOREIGN KEY (attack_id) REFERENCES attacks(id) ON DELETE CASCADE
);

CREATE TABLE attack_screenshots (
    id INT PRIMARY KEY AUTO_INCREMENT,
    attack_id INT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    FOREIGN KEY (attack_id) REFERENCES attacks(id) ON DELETE CASCADE
);

CREATE TABLE attack_forensics_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    attack_id INT NOT NULL UNIQUE,
    malware_hash VARCHAR(255),
    exfiltration_detected BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (attack_id) REFERENCES attacks(id) ON DELETE CASCADE
);

CREATE TABLE attack_c2_servers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    attack_id INT NOT NULL,
    c2_server VARCHAR(255) NOT NULL,
    FOREIGN KEY (attack_id) REFERENCES attacks(id) ON DELETE CASCADE
);

CREATE TABLE attack_persistence_mechanisms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    attack_id INT NOT NULL,
    mechanism VARCHAR(255) NOT NULL,
    FOREIGN KEY (attack_id) REFERENCES attacks(id) ON DELETE CASCADE
);

CREATE TABLE attack_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    attack_id INT NOT NULL,
    tag VARCHAR(100) NOT NULL,
    FOREIGN KEY (attack_id) REFERENCES attacks(id) ON DELETE CASCADE
);

CREATE TABLE attack_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    attack_id INT NOT NULL,
    category VARCHAR(100) NOT NULL,
    FOREIGN KEY (attack_id) REFERENCES attacks(id) ON DELETE CASCADE
);

CREATE TABLE attack_relations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    attack_id INT NOT NULL,
    related_attack_id INT NOT NULL,
    relation_type VARCHAR(50),
    FOREIGN KEY (attack_id) REFERENCES attacks(id) ON DELETE CASCADE,
    FOREIGN KEY (related_attack_id) REFERENCES attacks(id) ON DELETE CASCADE
);

CREATE TABLE attack_vulnerabilities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    attack_id INT NOT NULL,
    vulnerability_id INT NOT NULL,
    FOREIGN KEY (attack_id) REFERENCES attacks(id) ON DELETE CASCADE,
    FOREIGN KEY (vulnerability_id) REFERENCES vulnerabilities(id) ON DELETE CASCADE
);

CREATE TABLE attack_indicators (
    id INT PRIMARY KEY AUTO_INCREMENT,
    attack_id INT NOT NULL,
    threat_intelligence_id INT NOT NULL,
    FOREIGN KEY (attack_id) REFERENCES attacks(id) ON DELETE CASCADE,
    FOREIGN KEY (threat_intelligence_id) REFERENCES threat_intelligence(id) ON DELETE CASCADE
);
```

### 3. IPs Table
```sql
CREATE TABLE ips (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ip_address VARCHAR(45) NOT NULL UNIQUE,
    ip_version TINYINT CHECK (ip_version IN (4, 6)) DEFAULT 4,
    country VARCHAR(100),
    country_code VARCHAR(2),
    city VARCHAR(100),
    region VARCHAR(100),
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    isp VARCHAR(255),
    organization VARCHAR(255),
    asn VARCHAR(50),
    asn_name VARCHAR(255),
    reported_count INT DEFAULT 0,
    attack_count INT DEFAULT 0,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_report TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    threat_score INT CHECK (threat_score >= 0 AND threat_score <= 100) DEFAULT 0,
    reputation_score INT CHECK (reputation_score >= 0 AND reputation_score <= 100) DEFAULT 100,
    risk_level ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Low',
    is_blacklisted BOOLEAN DEFAULT FALSE,
    blacklisted_at TIMESTAMP NULL,
    blacklist_reason TEXT,
    registrar VARCHAR(255),
    whois_created_date TIMESTAMP NULL,
    whois_updated_date TIMESTAMP NULL,
    whois_expiry_date TIMESTAMP NULL,
    registrant VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_tor_exit_node BOOLEAN DEFAULT FALSE,
    is_proxy BOOLEAN DEFAULT FALSE,
    is_vpn BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_enrichment TIMESTAMP NULL
);

CREATE TABLE ip_blacklist_sources (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ip_id INT NOT NULL,
    source VARCHAR(100) NOT NULL,
    FOREIGN KEY (ip_id) REFERENCES ips(id) ON DELETE CASCADE
);

CREATE TABLE ip_associated_domains (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ip_id INT NOT NULL,
    domain VARCHAR(255) NOT NULL,
    FOREIGN KEY (ip_id) REFERENCES ips(id) ON DELETE CASCADE
);

CREATE TABLE ip_malware_families (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ip_id INT NOT NULL,
    family VARCHAR(255) NOT NULL,
    FOREIGN KEY (ip_id) REFERENCES ips(id) ON DELETE CASCADE
);

CREATE TABLE ip_attack_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ip_id INT NOT NULL,
    attack_type VARCHAR(100) NOT NULL,
    FOREIGN KEY (ip_id) REFERENCES ips(id) ON DELETE CASCADE
);

CREATE TABLE ip_attacks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ip_id INT NOT NULL,
    attack_id INT NOT NULL,
    FOREIGN KEY (ip_id) REFERENCES ips(id) ON DELETE CASCADE,
    FOREIGN KEY (attack_id) REFERENCES attacks(id) ON DELETE CASCADE
);

CREATE TABLE ip_open_ports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ip_id INT NOT NULL,
    port INT NOT NULL CHECK (port >= 1 AND port <= 65535),
    FOREIGN KEY (ip_id) REFERENCES ips(id) ON DELETE CASCADE
);

CREATE TABLE ip_services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ip_id INT NOT NULL,
    port INT,
    service VARCHAR(100),
    version VARCHAR(255),
    banner TEXT,
    ssl_issuer VARCHAR(255),
    ssl_valid_from TIMESTAMP NULL,
    ssl_valid_to TIMESTAMP NULL,
    FOREIGN KEY (ip_id) REFERENCES ips(id) ON DELETE CASCADE
);

CREATE TABLE ip_whois_nameservers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ip_id INT NOT NULL,
    nameserver VARCHAR(255) NOT NULL,
    FOREIGN KEY (ip_id) REFERENCES ips(id) ON DELETE CASCADE
);

CREATE TABLE ip_virustotal_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ip_id INT NOT NULL UNIQUE,
    last_analysis_date TIMESTAMP,
    malicious INT DEFAULT 0,
    suspicious INT DEFAULT 0,
    harmless INT DEFAULT 0,
    undetected INT DEFAULT 0,
    reputation INT,
    url VARCHAR(500),
    FOREIGN KEY (ip_id) REFERENCES ips(id) ON DELETE CASCADE
);

CREATE TABLE ip_abuseipdb_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ip_id INT NOT NULL UNIQUE,
    abuse_confidence_score INT,
    total_reports INT DEFAULT 0,
    num_distinct_users INT DEFAULT 0,
    last_reported TIMESTAMP,
    country_code VARCHAR(2),
    FOREIGN KEY (ip_id) REFERENCES ips(id) ON DELETE CASCADE
);

CREATE TABLE ip_abuseipdb_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ip_id INT NOT NULL,
    category_id INT NOT NULL,
    FOREIGN KEY (ip_id) REFERENCES ips(id) ON DELETE CASCADE
);

CREATE TABLE ip_shodan_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ip_id INT NOT NULL UNIQUE,
    last_scan TIMESTAMP,
    FOREIGN KEY (ip_id) REFERENCES ips(id) ON DELETE CASCADE
);

CREATE TABLE ip_shodan_hostnames (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ip_id INT NOT NULL,
    hostname VARCHAR(255) NOT NULL,
    FOREIGN KEY (ip_id) REFERENCES ips(id) ON DELETE CASCADE
);

CREATE TABLE ip_shodan_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ip_id INT NOT NULL,
    tag VARCHAR(100) NOT NULL,
    FOREIGN KEY (ip_id) REFERENCES ips(id) ON DELETE CASCADE
);

CREATE TABLE ip_shodan_vulns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ip_id INT NOT NULL,
    vuln VARCHAR(255) NOT NULL,
    FOREIGN KEY (ip_id) REFERENCES ips(id) ON DELETE CASCADE
);

CREATE TABLE ip_analyst_comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ip_id INT NOT NULL,
    user_id INT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ip_id) REFERENCES ips(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE ip_actions_taken (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ip_id INT NOT NULL,
    action VARCHAR(500) NOT NULL,
    performed_by INT,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ip_id) REFERENCES ips(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id)
);

CREATE TABLE ip_enrichment_sources (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ip_id INT NOT NULL,
    source VARCHAR(100) NOT NULL,
    FOREIGN KEY (ip_id) REFERENCES ips(id) ON DELETE CASCADE
);
```

### 4. Sources Table
```sql
CREATE TABLE sources (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255),
    type ENUM('API', 'RSS', 'CSV', 'Manual', 'Webhook') NOT NULL,
    category VARCHAR(100),
    api_endpoint VARCHAR(500),
    api_key VARCHAR(500),
    api_version VARCHAR(50),
    authentication_method ENUM('API_KEY', 'OAuth', 'Basic', 'Bearer') DEFAULT 'API_KEY',
    sync_enabled BOOLEAN DEFAULT TRUE,
    sync_interval INT DEFAULT 3600,
    last_sync TIMESTAMP NULL,
    next_sync TIMESTAMP NULL,
    sync_status ENUM('Success', 'Failed', 'In Progress') DEFAULT 'Success',
    records_collected INT DEFAULT 0,
    total_syncs INT DEFAULT 0,
    successful_syncs INT DEFAULT 0,
    failed_syncs INT DEFAULT 0,
    average_response_time DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    reliability_score INT CHECK (reliability_score >= 0 AND reliability_score <= 100) DEFAULT 50,
    data_quality_score INT CHECK (data_quality_score >= 0 AND data_quality_score <= 100) DEFAULT 50,
    error_count INT DEFAULT 0,
    last_error TEXT,
    last_error_date TIMESTAMP NULL,
    consecutive_errors INT DEFAULT 0,
    max_consecutive_errors INT DEFAULT 5,
    rate_limit INT,
    rate_limit_period VARCHAR(50),
    current_usage INT DEFAULT 0,
    rate_limit_reset TIMESTAMP NULL,
    timeout INT DEFAULT 30000,
    documentation_url VARCHAR(500),
    support_email VARCHAR(255),
    terms_of_service_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE TABLE source_configuration (
    id INT PRIMARY KEY AUTO_INCREMENT,
    source_id INT NOT NULL UNIQUE,
    endpoint_paths JSON,
    default_params JSON,
    max_retries INT DEFAULT 3,
    retry_delay INT DEFAULT 5000,
    backoff_multiplier DECIMAL(3,2) DEFAULT 2.0,
    headers JSON,
    FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
);

CREATE TABLE source_data_mapping (
    id INT PRIMARY KEY AUTO_INCREMENT,
    source_id INT NOT NULL UNIQUE,
    mapping JSON,
    FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
);

CREATE TABLE source_filters (
    id INT PRIMARY KEY AUTO_INCREMENT,
    source_id INT NOT NULL UNIQUE,
    min_confidence_score INT,
    FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
);

CREATE TABLE source_filter_countries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    source_id INT NOT NULL,
    country VARCHAR(100) NOT NULL,
    FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
);

CREATE TABLE source_filter_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    source_id INT NOT NULL,
    category_id INT NOT NULL,
    FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
);

CREATE TABLE source_pricing (
    id INT PRIMARY KEY AUTO_INCREMENT,
    source_id INT NOT NULL UNIQUE,
    plan VARCHAR(100),
    cost_per_month DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    requests_included INT,
    FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
);

CREATE TABLE source_webhook (
    id INT PRIMARY KEY AUTO_INCREMENT,
    source_id INT NOT NULL UNIQUE,
    enabled BOOLEAN DEFAULT FALSE,
    url VARCHAR(500),
    secret VARCHAR(255),
    FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
);

CREATE TABLE source_webhook_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    source_id INT NOT NULL,
    event VARCHAR(100) NOT NULL,
    FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
);
```

### 5. Reports Table
```sql
CREATE TABLE reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    report_type ENUM('Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual', 'Custom', 'Incident') NOT NULL,
    report_id VARCHAR(100) UNIQUE,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    summary TEXT,
    executive_summary TEXT,
    detailed_analysis TEXT,
    format ENUM('PDF', 'CSV', 'Excel', 'JSON', 'HTML') DEFAULT 'PDF',
    file_path VARCHAR(500),
    file_size BIGINT,
    generated_by INT NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generation_time_seconds INT,
    is_public BOOLEAN DEFAULT FALSE,
    access_count INT DEFAULT 0,
    last_accessed TIMESTAMP NULL,
    notes TEXT,
    version INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (generated_by) REFERENCES users(id)
);

CREATE TABLE report_statistics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_id INT NOT NULL UNIQUE,
    total_attacks INT DEFAULT 0,
    attacks_by_type JSON,
    attacks_by_country JSON,
    top_ips JSON,
    severity_distribution JSON,
    financial_impact DECIMAL(15,2) DEFAULT 0,
    affected_users INT DEFAULT 0,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

CREATE TABLE report_recommendations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_id INT NOT NULL,
    recommendation TEXT NOT NULL,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

CREATE TABLE report_filters (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_id INT NOT NULL UNIQUE,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

CREATE TABLE report_filter_attack_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_id INT NOT NULL,
    attack_type VARCHAR(100) NOT NULL,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

CREATE TABLE report_filter_countries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_id INT NOT NULL,
    country VARCHAR(100) NOT NULL,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

CREATE TABLE report_filter_severity_levels (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_id INT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

CREATE TABLE report_filter_statuses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_id INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

CREATE TABLE report_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_id INT NOT NULL,
    tag VARCHAR(100) NOT NULL,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

CREATE TABLE report_shared_with (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_id INT NOT NULL,
    user_id INT NOT NULL,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 6. Alerts Table
```sql
CREATE TABLE alerts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    alert_type ENUM('Attack Detected', 'High Severity', 'Critical Severity', 'IP Blacklisted', 'Anomaly Detected', 'System Alert', 'Custom') NOT NULL,
    severity ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    description TEXT NOT NULL,
    message TEXT,
    source_type ENUM('Attack', 'IP', 'System', 'External API', 'Custom Rule') NOT NULL,
    source_id INT,
    source_model ENUM('Attack', 'IP', NULL),
    trigger_conditions JSON,
    rule_name VARCHAR(255),
    status ENUM('Active', 'Acknowledged', 'Resolved', 'Dismissed') DEFAULT 'Active',
    acknowledged_by INT,
    acknowledged_at TIMESTAMP NULL,
    resolved_by INT,
    resolved_at TIMESTAMP NULL,
    notifications_sent BOOLEAN DEFAULT FALSE,
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    expires_at TIMESTAMP NULL,
    auto_resolve BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (acknowledged_by) REFERENCES users(id),
    FOREIGN KEY (resolved_by) REFERENCES users(id)
);

CREATE TABLE alert_notification_channels (
    id INT PRIMARY KEY AUTO_INCREMENT,
    alert_id INT NOT NULL,
    type ENUM('Email', 'SMS', 'Push', 'Webhook') NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recipient VARCHAR(255),
    status ENUM('Sent', 'Failed', 'Pending') DEFAULT 'Pending',
    FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE
);

CREATE TABLE alert_actions_taken (
    id INT PRIMARY KEY AUTO_INCREMENT,
    alert_id INT NOT NULL,
    action VARCHAR(500) NOT NULL,
    performed_by INT,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id)
);

CREATE TABLE alert_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    alert_id INT NOT NULL,
    tag VARCHAR(100) NOT NULL,
    FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE
);
```

### 7. Threat Intelligence Table
```sql
CREATE TABLE threat_intelligence (
    id INT PRIMARY KEY AUTO_INCREMENT,
    indicator VARCHAR(500) NOT NULL,
    indicator_type ENUM('ip', 'domain', 'url', 'hash', 'email', 'filename', 'registry_key', 'other') NOT NULL,
    threat_type ENUM('Malware', 'Phishing', 'C2', 'Exploit', 'APT', 'Ransomware', 'Trojan', 'Botnet', 'Other'),
    threat_family VARCHAR(255),
    threat_actor VARCHAR(255),
    threat_score INT CHECK (threat_score >= 0 AND threat_score <= 100) DEFAULT 0,
    confidence_level INT CHECK (confidence_level >= 0 AND confidence_level <= 100) DEFAULT 50,
    reputation ENUM('Malicious', 'Suspicious', 'Unknown', 'Benign') DEFAULT 'Unknown',
    is_active BOOLEAN DEFAULT TRUE,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    description TEXT,
    context TEXT,
    kill_chain_phase ENUM('Reconnaissance', 'Weaponization', 'Delivery', 'Exploitation', 'Installation', 'Command and Control', 'Actions on Objectives'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE TABLE threat_intelligence_sources (
    id INT PRIMARY KEY AUTO_INCREMENT,
    threat_intelligence_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    source_type ENUM('VirusTotal', 'AbuseIPDB', 'Shodan', 'OTX', 'Internal', 'Manual', 'Other') NOT NULL,
    first_seen TIMESTAMP,
    last_seen TIMESTAMP,
    detection_count INT DEFAULT 0,
    source_url VARCHAR(500),
    FOREIGN KEY (threat_intelligence_id) REFERENCES threat_intelligence(id) ON DELETE CASCADE
);

CREATE TABLE threat_intelligence_metadata (
    id INT PRIMARY KEY AUTO_INCREMENT,
    threat_intelligence_id INT NOT NULL UNIQUE,
    file_type VARCHAR(100),
    file_size BIGINT,
    md5 VARCHAR(32),
    sha1 VARCHAR(40),
    sha256 VARCHAR(64),
    ssdeep VARCHAR(255),
    asn VARCHAR(50),
    country VARCHAR(100),
    registrar VARCHAR(255),
    creation_date TIMESTAMP NULL,
    expiration_date TIMESTAMP NULL,
    FOREIGN KEY (threat_intelligence_id) REFERENCES threat_intelligence(id) ON DELETE CASCADE
);

CREATE TABLE threat_intelligence_related_indicators (
    id INT PRIMARY KEY AUTO_INCREMENT,
    threat_intelligence_id INT NOT NULL,
    related_indicator_id INT NOT NULL,
    FOREIGN KEY (threat_intelligence_id) REFERENCES threat_intelligence(id) ON DELETE CASCADE,
    FOREIGN KEY (related_indicator_id) REFERENCES threat_intelligence(id) ON DELETE CASCADE
);

CREATE TABLE threat_intelligence_related_attacks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    threat_intelligence_id INT NOT NULL,
    attack_id INT NOT NULL,
    FOREIGN KEY (threat_intelligence_id) REFERENCES threat_intelligence(id) ON DELETE CASCADE,
    FOREIGN KEY (attack_id) REFERENCES attacks(id) ON DELETE CASCADE
);

CREATE TABLE threat_intelligence_actions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    threat_intelligence_id INT NOT NULL,
    action VARCHAR(500) NOT NULL,
    performed_by INT,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (threat_intelligence_id) REFERENCES threat_intelligence(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id)
);

CREATE TABLE threat_intelligence_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    threat_intelligence_id INT NOT NULL,
    tag VARCHAR(100) NOT NULL,
    FOREIGN KEY (threat_intelligence_id) REFERENCES threat_intelligence(id) ON DELETE CASCADE
);

CREATE TABLE threat_intelligence_mitre_techniques (
    id INT PRIMARY KEY AUTO_INCREMENT,
    threat_intelligence_id INT NOT NULL,
    technique VARCHAR(100) NOT NULL,
    FOREIGN KEY (threat_intelligence_id) REFERENCES threat_intelligence(id) ON DELETE CASCADE
);
```

### 8. Vulnerabilities Table
```sql
CREATE TABLE vulnerabilities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cve_id VARCHAR(50) NOT NULL UNIQUE,
    cwe_id VARCHAR(50),
    title VARCHAR(500),
    description TEXT NOT NULL,
    summary TEXT,
    cvss_score DECIMAL(3,1) CHECK (cvss_score >= 0 AND cvss_score <= 10),
    cvss_version ENUM('2.0', '3.0', '3.1') DEFAULT '3.1',
    cvss_vector VARCHAR(500),
    base_score DECIMAL(3,1),
    temporal_score DECIMAL(3,1),
    environmental_score DECIMAL(3,1),
    severity ENUM('None', 'Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    exploitability_score DECIMAL(3,1),
    impact_score DECIMAL(3,1),
    published_date TIMESTAMP,
    modified_date TIMESTAMP,
    assigned_date TIMESTAMP,
    is_exploited BOOLEAN DEFAULT FALSE,
    exploited_in_attacks INT DEFAULT 0,
    exploit_available BOOLEAN DEFAULT FALSE,
    exploit_maturity ENUM('Unproven', 'Proof-of-Concept', 'Functional', 'High', 'Not Defined'),
    patch_available BOOLEAN DEFAULT FALSE,
    remediation TEXT,
    attack_pattern VARCHAR(255),
    source ENUM('NVD', 'CVE', 'Manual', 'External API') DEFAULT 'NVD',
    source_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE vulnerability_affected_products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vulnerability_id INT NOT NULL,
    vendor VARCHAR(255),
    product VARCHAR(255),
    version VARCHAR(100),
    update_version VARCHAR(100),
    edition VARCHAR(100),
    language VARCHAR(50),
    FOREIGN KEY (vulnerability_id) REFERENCES vulnerabilities(id) ON DELETE CASCADE
);

CREATE TABLE vulnerability_references (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vulnerability_id INT NOT NULL,
    url VARCHAR(500) NOT NULL,
    source VARCHAR(255),
    FOREIGN KEY (vulnerability_id) REFERENCES vulnerabilities(id) ON DELETE CASCADE
);

CREATE TABLE vulnerability_reference_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vulnerability_reference_id INT NOT NULL,
    tag VARCHAR(100) NOT NULL,
    FOREIGN KEY (vulnerability_reference_id) REFERENCES vulnerability_references(id) ON DELETE CASCADE
);

CREATE TABLE vulnerability_patch_urls (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vulnerability_id INT NOT NULL,
    url VARCHAR(500) NOT NULL,
    FOREIGN KEY (vulnerability_id) REFERENCES vulnerabilities(id) ON DELETE CASCADE
);

CREATE TABLE vulnerability_related_attacks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vulnerability_id INT NOT NULL,
    attack_id INT NOT NULL,
    FOREIGN KEY (vulnerability_id) REFERENCES vulnerabilities(id) ON DELETE CASCADE,
    FOREIGN KEY (attack_id) REFERENCES attacks(id) ON DELETE CASCADE
);

CREATE TABLE vulnerability_mitre_techniques (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vulnerability_id INT NOT NULL,
    technique VARCHAR(100) NOT NULL,
    FOREIGN KEY (vulnerability_id) REFERENCES vulnerabilities(id) ON DELETE CASCADE
);

CREATE TABLE vulnerability_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vulnerability_id INT NOT NULL,
    tag VARCHAR(100) NOT NULL,
    FOREIGN KEY (vulnerability_id) REFERENCES vulnerabilities(id) ON DELETE CASCADE
);

CREATE TABLE vulnerability_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vulnerability_id INT NOT NULL,
    category VARCHAR(100) NOT NULL,
    FOREIGN KEY (vulnerability_id) REFERENCES vulnerabilities(id) ON DELETE CASCADE
);
```

### 9. Audit Logs Table
```sql
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    action ENUM('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'SYNC', 'OTHER') NOT NULL,
    resource_type ENUM('Attack', 'IP', 'User', 'Source', 'Report', 'Alert', 'ThreatIntelligence', 'Vulnerability', 'System') NOT NULL,
    resource_id INT,
    user_id INT,
    username VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    description TEXT,
    details JSON,
    changes_before JSON,
    changes_after JSON,
    fields_changed JSON,
    status ENUM('Success', 'Failed', 'Partial') DEFAULT 'Success',
    error_message TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_ms INT,
    risk_level ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Low',
    is_suspicious BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE audit_log_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    audit_log_id INT NOT NULL,
    tag VARCHAR(100) NOT NULL,
    FOREIGN KEY (audit_log_id) REFERENCES audit_logs(id) ON DELETE CASCADE
);
```

---

## Part 2: MongoDB Collections Schema (After Migration)

### 1. Users Collection
```javascript
{
  _id: ObjectId("..."),
  username: "john_doe",
  email: "john@example.com",
  full_name: "John Doe",
  password: "$2b$10$...", // hashed
  password_last_changed: ISODate("2025-01-15T10:00:00Z"),
  password_history: [
    { password: "$2b$10$...", changed_at: ISODate("2024-12-01T10:00:00Z") }
  ],
  role: "analyst",
  permissions: ["read:attacks", "write:attacks", "read:reports"],
  organization: "EMSI",
  department: "Security",
  job_title: "Security Analyst",
  phone: "+212612345678",
  office_location: "Casablanca",
  is_active: true,
  is_verified: true,
  is_locked: false,
  locked_until: null,
  last_login: ISODate("2025-01-20T14:30:00Z"),
  last_login_ip: "192.168.1.100",
  login_count: 150,
  failed_login_attempts: 0,
  last_failed_login: null,
  two_factor_enabled: false,
  two_factor_secret: null,
  two_factor_backup_codes: [],
  security_questions: [
    { question: "What is your mother's maiden name?", answer: "hashed_answer" }
  ],
  api_token: "token_here",
  api_token_created: ISODate("2025-01-01T00:00:00Z"),
  api_token_expires: ISODate("2026-01-01T00:00:00Z"),
  refresh_tokens: [
    {
      token: "refresh_token_here",
      created_at: ISODate("2025-01-20T14:30:00Z"),
      expires_at: ISODate("2025-02-20T14:30:00Z"),
      device: "Chrome on Windows",
      ip_address: "192.168.1.100"
    }
  ],
  active_sessions: [
    {
      session_id: "session_id_here",
      device: "Chrome on Windows",
      ip_address: "192.168.1.100",
      user_agent: "Mozilla/5.0...",
      created_at: ISODate("2025-01-20T14:30:00Z"),
      last_activity: ISODate("2025-01-20T15:00:00Z")
    }
  ],
  preferences: {
    language: "en",
    timezone: "Africa/Casablanca",
    date_format: "YYYY-MM-DD",
    theme: "dark",
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true
  },
  notification_preferences: {
    new_attack_high_severity: true,
    new_attack_critical_severity: true,
    alert_triggered: true,
    report_generated: false,
    system_updates: false,
    digest_frequency: "daily"
  },
  dashboard_config: {
    layout: "grid",
    widgets: [{ type: "attacks_chart", position: { x: 0, y: 0 } }]
  },
  statistics: {
    attacks_created: 45,
    attacks_resolved: 38,
    reports_generated: 12,
    alerts_acknowledged: 89,
    average_response_time: 15
  },
  avatar_url: "https://...",
  bio: "Security analyst with 5 years experience",
  social_links: {
    linkedin: "https://linkedin.com/in/johndoe",
    twitter: "@johndoe"
  },
  gdpr_consent: true,
  gdpr_consent_date: ISODate("2025-01-01T00:00:00Z"),
  terms_accepted: true,
  terms_accepted_date: ISODate("2025-01-01T00:00:00Z"),
  created_at: ISODate("2025-01-01T00:00:00Z"),
  updated_at: ISODate("2025-01-20T15:00:00Z"),
  created_by: ObjectId("...")
}
```

### 2. Attacks Collection
```javascript
{
  _id: ObjectId("..."),
  type: "Phishing",
  subtype: "Spear Phishing",
  source_ip: "185.122.54.90",
  source_ip_ref: ObjectId("..."), // Reference to IPs collection
  source_country: "Russia",
  source_asn: "AS12345",
  source_isp: "Evil Corp ISP",
  target_country: "Morocco",
  target_org: "EMSI",
  target_sector: "Education",
  target_systems: ["mail.emsi.ma", "portal.emsi.ma"], // Embedded array
  target_ips: ["192.168.1.100"], // Embedded array
  date: ISODate("2025-01-19T12:30:00Z"),
  detected_at: ISODate("2025-01-19T12:35:00Z"),
  duration_seconds: 3600,
  timezone: "Africa/Casablanca",
  severity: "High",
  severity_score: 8.5,
  cvss_score: 8.3,
  confidence_level: 95,
  data_loss: 5000, // MB
  financial_impact: 50000, // USD
  affected_users: 1200,
  downtime_minutes: 240,
  description: "Sophisticated phishing campaign...",
  attack_vector: "Email with malicious attachment",
  attack_pattern: "MITRE ATT&CK: T1566.001",
  status: "Mitigated",
  priority: "High",
  assigned_to: ObjectId("..."), // Reference to User
  reported_by: ObjectId("..."), // Reference to User
  reported_at: ISODate("2025-01-19T12:40:00Z"),
  verified: true,
  verified_by: ObjectId("..."), // Reference to User
  mitigation_actions: [ // Embedded array of objects
    {
      action: "Blocked sender IP",
      performed_by: ObjectId("..."),
      performed_at: ISODate("2025-01-19T12:50:00Z"),
      effectiveness: "High"
    },
    {
      action: "Password reset for affected users",
      performed_by: ObjectId("..."),
      performed_at: ISODate("2025-01-19T13:00:00Z"),
      effectiveness: "Medium"
    }
  ],
  evidence_files: ["/evidence/file1.pdf", "/evidence/file2.log"], // Embedded array
  screenshots: ["/screenshots/screen1.png"], // Embedded array
  forensics_data: { // Embedded object
    malware_hash: "abc123...",
    c2_servers: ["c2.example.com", "c2.evil.com"], // Embedded array
    exfiltration_detected: true,
    persistence_mechanisms: ["registry_key", "scheduled_task"] // Embedded array
  },
  tags: ["phishing", "spear-phishing", "credential-theft"], // Embedded array
  categories: ["email-security", "social-engineering"], // Embedded array
  threat_actor: "APT28",
  campaign_id: "CAMP-2025-001",
  related_attacks: [ObjectId("..."), ObjectId("...")], // Array of references
  related_vulnerabilities: [ObjectId("...")], // Array of references
  related_indicators: [ObjectId("...")], // Array of references
  source: "Manual Report",
  source_reliability: "A",
  gdpr_relevant: true,
  law_enforcement_notified: false,
  notification_required: true,
  breach_notification_date: ISODate("2025-01-20T00:00:00Z"),
  processed: true,
  enriched: true,
  last_enrichment: ISODate("2025-01-19T13:00:00Z"),
  created_at: ISODate("2025-01-19T12:30:00Z"),
  updated_at: ISODate("2025-01-19T13:00:00Z")
}
```

### 3. IPs Collection
```javascript
{
  _id: ObjectId("..."),
  ip_address: "185.122.54.90",
  ip_version: 4,
  country: "Russia",
  country_code: "RU",
  city: "Moscow",
  region: "Moscow",
  postal_code: "101000",
  geolocation: {
    type: "Point",
    coordinates: [37.6173, 55.7558] // [longitude, latitude]
  },
  isp: "Evil Corp ISP",
  organization: "Evil Corp",
  asn: "AS12345",
  asn_name: "Evil Corp ASN",
  reported_count: 15,
  attack_count: 12,
  first_seen: ISODate("2025-01-01T00:00:00Z"),
  last_report: ISODate("2025-01-19T12:30:00Z"),
  last_activity: ISODate("2025-01-19T12:30:00Z"),
  threat_score: 85,
  reputation_score: 15,
  risk_level: "High",
  is_blacklisted: true,
  blacklisted_at: ISODate("2025-01-10T00:00:00Z"),
  blacklist_sources: ["AbuseIPDB", "Internal"], // Embedded array
  blacklist_reason: "Multiple phishing attacks detected",
  whois_data: { // Embedded object
    registrar: "Registrar Inc",
    created_date: ISODate("2020-01-01T00:00:00Z"),
    updated_date: ISODate("2024-12-01T00:00:00Z"),
    expiry_date: ISODate("2026-01-01T00:00:00Z"),
    nameservers: ["ns1.example.com", "ns2.example.com"], // Embedded array
    registrant: "Evil Corp"
  },
  associated_domains: ["evil.com", "malicious.net"], // Embedded array
  malware_families: ["TrickBot", "Emotet"], // Embedded array
  attack_types: ["Phishing", "DDoS", "Malware"], // Embedded array
  attacks: [ObjectId("..."), ObjectId("...")], // Array of references
  open_ports: [80, 443, 8080], // Embedded array
  services: [ // Embedded array of objects
    {
      port: 80,
      service: "HTTP",
      version: "nginx/1.18.0",
      banner: "HTTP/1.1 200 OK",
      ssl_cert: {
        issuer: "Let's Encrypt",
        valid_from: ISODate("2024-01-01T00:00:00Z"),
        valid_to: ISODate("2025-01-01T00:00:00Z")
      }
    }
  ],
  virustotal_data: { // Embedded object
    last_analysis_date: ISODate("2025-01-19T10:00:00Z"),
    malicious: 45,
    suspicious: 5,
    harmless: 10,
    undetected: 0,
    reputation: -50,
    url: "https://virustotal.com/..."
  },
  abuseipdb_data: { // Embedded object
    abuse_confidence_score: 100,
    total_reports: 150,
    num_distinct_users: 45,
    last_reported: ISODate("2025-01-19T12:00:00Z"),
    categories: [14, 15, 18], // Embedded array
    country_code: "RU"
  },
  shodan_data: { // Embedded object
    last_scan: ISODate("2025-01-19T08:00:00Z"),
    hostnames: ["evil.com"], // Embedded array
    tags: ["malware", "phishing"], // Embedded array
    vulns: ["CVE-2024-1234"] // Embedded array
  },
  is_active: true,
  is_tor_exit_node: false,
  is_proxy: false,
  is_vpn: false,
  notes: "Known malicious IP, block immediately",
  analyst_comments: [ // Embedded array of objects
    {
      user: ObjectId("..."),
      comment: "Confirmed malicious activity",
      created_at: ISODate("2025-01-19T12:00:00Z")
    }
  ],
  actions_taken: [ // Embedded array of objects
    {
      action: "Blocked at firewall",
      performed_by: ObjectId("..."),
      performed_at: ISODate("2025-01-19T12:30:00Z")
    }
  ],
  created_at: ISODate("2025-01-01T00:00:00Z"),
  updated_at: ISODate("2025-01-19T12:30:00Z"),
  last_enrichment: ISODate("2025-01-19T12:00:00Z"),
  enrichment_sources: ["VirusTotal", "AbuseIPDB", "Shodan"] // Embedded array
}
```

### 4. Sources Collection
```javascript
{
  _id: ObjectId("..."),
  name: "VirusTotal",
  display_name: "VirusTotal API",
  type: "API",
  category: "Threat Intelligence",
  api_endpoint: "https://www.virustotal.com/api/v3",
  api_key: "encrypted_key_here",
  api_version: "v3",
  authentication_method: "API_KEY",
  sync_enabled: true,
  sync_interval: 3600,
  last_sync: ISODate("2025-01-20T10:00:00Z"),
  next_sync: ISODate("2025-01-20T11:00:00Z"),
  sync_status: "Success",
  records_collected: 50000,
  total_syncs: 1000,
  successful_syncs: 980,
  failed_syncs: 20,
  average_response_time: 1.5,
  is_active: true,
  reliability_score: 95,
  data_quality_score: 90,
  error_count: 5,
  last_error: null,
  last_error_date: null,
  consecutive_errors: 0,
  max_consecutive_errors: 5,
  rate_limit: 500,
  rate_limit_period: "minute",
  current_usage: 45,
  rate_limit_reset: ISODate("2025-01-20T11:00:00Z"),
  configuration: { // Embedded object
    endpoint_paths: {
      ip: "/ip_addresses/{ip}",
      domain: "/domains/{domain}"
    },
    default_params: {
      timeout: 30000
    },
    retry_config: {
      max_retries: 3,
      retry_delay: 5000,
      backoff_multiplier: 2
    },
    timeout: 30000,
    headers: {
      "x-apikey": "encrypted_key"
    }
  },
  data_mapping: { // Embedded object
    "ip": "data.attributes.ip_address",
    "reputation": "data.attributes.reputation"
  },
  filters: { // Embedded object
    min_confidence_score: 70,
    countries: ["RU", "CN", "KP"],
    categories: [14, 15, 18]
  },
  pricing: { // Embedded object
    plan: "Professional",
    cost_per_month: 100,
    currency: "USD",
    requests_included: 100000
  },
  webhook: { // Embedded object
    enabled: false,
    url: null,
    secret: null,
    events: []
  },
  documentation_url: "https://docs.virustotal.com",
  support_email: "support@virustotal.com",
  terms_of_service_url: "https://virustotal.com/terms",
  created_at: ISODate("2025-01-01T00:00:00Z"),
  updated_at: ISODate("2025-01-20T10:00:00Z"),
  created_by: ObjectId("..."),
  updated_by: ObjectId("...")
}
```

### 5. Reports Collection
```javascript
{
  _id: ObjectId("..."),
  title: "Monthly Security Report - January 2025",
  report_type: "Monthly",
  report_id: "RPT-2025-01",
  start_date: ISODate("2025-01-01T00:00:00Z"),
  end_date: ISODate("2025-01-31T23:59:59Z"),
  summary: "This report covers all security incidents...",
  executive_summary: "During January 2025, we detected...",
  detailed_analysis: "Detailed analysis of all incidents...",
  recommendations: [ // Embedded array
    "Implement stronger email filtering",
    "Increase monitoring for DDoS attacks",
    "Update firewall rules"
  ],
  statistics: { // Embedded object
    total_attacks: 150,
    attacks_by_type: {
      "Phishing": 80,
      "DDoS": 40,
      "Malware": 30
    },
    attacks_by_country: {
      "Russia": 50,
      "China": 30,
      "North Korea": 20
    },
    top_ips: [
      { ip: "185.122.54.90", count: 15 },
      { ip: "192.168.1.1", count: 10 }
    ],
    severity_distribution: {
      "Critical": 10,
      "High": 50,
      "Medium": 70,
      "Low": 20
    },
    financial_impact: 500000,
    affected_users: 5000
  },
  filters: { // Embedded object
    date_range: {
      start: ISODate("2025-01-01T00:00:00Z"),
      end: ISODate("2025-01-31T23:59:59Z")
    },
    attack_types: ["Phishing", "DDoS", "Malware"],
    countries: ["Russia", "China"],
    severity_levels: ["High", "Critical"],
    statuses: ["Resolved", "Mitigated"]
  },
  format: "PDF",
  file_path: "/reports/RPT-2025-01.pdf",
  file_size: 2048000,
  generated_by: ObjectId("..."),
  generated_at: ISODate("2025-02-01T00:00:00Z"),
  generation_time_seconds: 45,
  is_public: false,
  shared_with: [ObjectId("..."), ObjectId("...")], // Array of references
  access_count: 15,
  last_accessed: ISODate("2025-02-05T10:00:00Z"),
  tags: ["monthly", "security", "incidents"], // Embedded array
  notes: "Report generated automatically",
  version: 1,
  created_at: ISODate("2025-02-01T00:00:00Z"),
  updated_at: ISODate("2025-02-01T00:00:00Z")
}
```

### 6. Alerts Collection
```javascript
{
  _id: ObjectId("..."),
  title: "Critical Severity Attack Detected",
  alert_type: "Critical Severity",
  severity: "Critical",
  description: "A critical severity attack has been detected...",
  message: "Immediate action required",
  source_type: "Attack",
  source_id: ObjectId("..."),
  source_model: "Attack",
  trigger_conditions: { // Embedded object
    severity: "Critical",
    country: "Russia"
  },
  rule_name: "Critical Attack Alert",
  status: "Active",
  acknowledged_by: null,
  acknowledged_at: null,
  resolved_by: null,
  resolved_at: null,
  notifications_sent: true,
  notification_channels: [ // Embedded array of objects
    {
      type: "Email",
      sent_at: ISODate("2025-01-19T12:35:00Z"),
      recipient: "admin@example.com",
      status: "Sent"
    },
    {
      type: "Push",
      sent_at: ISODate("2025-01-19T12:35:00Z"),
      recipient: "user_device_token",
      status: "Sent"
    }
  ],
  actions_taken: [ // Embedded array of objects
    {
      action: "Alert sent to security team",
      performed_by: ObjectId("..."),
      performed_at: ISODate("2025-01-19T12:35:00Z")
    }
  ],
  tags: ["critical", "attack", "urgent"], // Embedded array
  priority: "Critical",
  expires_at: ISODate("2025-01-20T12:35:00Z"),
  auto_resolve: false,
  created_at: ISODate("2025-01-19T12:35:00Z"),
  updated_at: ISODate("2025-01-19T12:35:00Z")
}
```

### 7. ThreatIntelligence Collection
```javascript
{
  _id: ObjectId("..."),
  indicator: "185.122.54.90",
  indicator_type: "ip",
  threat_type: "Malware",
  threat_family: "TrickBot",
  threat_actor: "APT28",
  threat_score: 90,
  confidence_level: 95,
  reputation: "Malicious",
  is_active: true,
  first_seen: ISODate("2025-01-01T00:00:00Z"),
  last_seen: ISODate("2025-01-19T12:30:00Z"),
  expires_at: ISODate("2026-01-01T00:00:00Z"),
  description: "Known malicious IP associated with TrickBot",
  context: "This IP has been used in multiple phishing campaigns",
  related_indicators: [ObjectId("..."), ObjectId("...")], // Array of references
  related_attacks: [ObjectId("..."), ObjectId("...")], // Array of references
  sources: [ // Embedded array of objects
    {
      name: "VirusTotal",
      source_type: "VirusTotal",
      first_seen: ISODate("2025-01-01T00:00:00Z"),
      last_seen: ISODate("2025-01-19T12:30:00Z"),
      detection_count: 45,
      source_url: "https://virustotal.com/..."
    },
    {
      name: "AbuseIPDB",
      source_type: "AbuseIPDB",
      first_seen: ISODate("2025-01-01T00:00:00Z"),
      last_seen: ISODate("2025-01-19T12:30:00Z"),
      detection_count: 150,
      source_url: "https://abuseipdb.com/..."
    }
  ],
  metadata: { // Embedded object
    file_type: null,
    file_size: null,
    md5: null,
    sha1: null,
    sha256: null,
    ssdeep: null,
    asn: "AS12345",
    country: "Russia",
    registrar: "Registrar Inc",
    creation_date: ISODate("2020-01-01T00:00:00Z"),
    expiration_date: ISODate("2026-01-01T00:00:00Z")
  },
  actions: [ // Embedded array of objects
    {
      action: "Added to blacklist",
      performed_by: ObjectId("..."),
      performed_at: ISODate("2025-01-19T12:30:00Z")
    }
  ],
  tags: ["malware", "trickbot", "apt28"], // Embedded array
  mitre_attack_techniques: ["T1566.001", "T1071.001"], // Embedded array
  kill_chain_phase: "Command and Control",
  created_at: ISODate("2025-01-01T00:00:00Z"),
  updated_at: ISODate("2025-01-19T12:30:00Z"),
  created_by: ObjectId("..."),
  updated_by: ObjectId("...")
}
```

### 8. Vulnerabilities Collection
```javascript
{
  _id: ObjectId("..."),
  cve_id: "CVE-2024-1234",
  cwe_id: "CWE-79",
  title: "Cross-Site Scripting (XSS) vulnerability",
  description: "A cross-site scripting vulnerability allows...",
  summary: "XSS vulnerability in web application",
  cvss_score: 8.3,
  cvss_version: "3.1",
  cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H",
  base_score: 8.3,
  temporal_score: 7.5,
  environmental_score: 8.0,
  severity: "High",
  exploitability_score: 2.8,
  impact_score: 5.9,
  affected_products: [ // Embedded array of objects
    {
      vendor: "Example Corp",
      product: "WebApp",
      version: "1.0",
      update: null,
      edition: "Standard",
      language: "en"
    }
  ],
  published_date: ISODate("2024-01-15T00:00:00Z"),
  modified_date: ISODate("2024-12-01T00:00:00Z"),
  assigned_date: ISODate("2024-01-10T00:00:00Z"),
  is_exploited: true,
  exploited_in_attacks: 5,
  related_attacks: [ObjectId("..."), ObjectId("...")], // Array of references
  exploit_available: true,
  exploit_maturity: "Functional",
  patch_available: true,
  patch_urls: [ // Embedded array
    "https://example.com/patches/CVE-2024-1234.patch"
  ],
  remediation: "Update to version 1.1 or apply patch",
  references: [ // Embedded array of objects
    {
      url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-1234",
      source: "CVE",
      tags: ["official", "cve"] // Embedded array
    }
  ],
  mitre_attack_techniques: ["T1059.007"], // Embedded array
  attack_pattern: "T1059.007",
  tags: ["xss", "web", "critical"], // Embedded array
  categories: ["web-security", "injection"], // Embedded array
  source: "NVD",
  source_url: "https://nvd.nist.gov/vuln/detail/CVE-2024-1234",
  created_at: ISODate("2024-01-15T00:00:00Z"),
  updated_at: ISODate("2024-12-01T00:00:00Z")
}
```

### 9. AuditLogs Collection
```javascript
{
  _id: ObjectId("..."),
  action: "UPDATE",
  resource_type: "Attack",
  resource_id: ObjectId("..."),
  user_id: ObjectId("..."),
  username: "john_doe",
  ip_address: "192.168.1.100",
  user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  description: "Updated attack status from 'Detected' to 'Mitigated'",
  details: { // Embedded object
    field: "status",
    old_value: "Detected",
    new_value: "Mitigated"
  },
  changes: { // Embedded object
    before: {
      status: "Detected",
      priority: "High"
    },
    after: {
      status: "Mitigated",
      priority: "High"
    },
    fields_changed: ["status"] // Embedded array
  },
  status: "Success",
  error_message: null,
  timestamp: ISODate("2025-01-19T13:00:00Z"),
  duration_ms: 45,
  risk_level: "Low",
  is_suspicious: false,
  tags: ["update", "attack", "status"] // Embedded array
}
```

---

## Summary: SQL vs MongoDB

### Total Tables/Collections
- **SQL**: 100+ tables (normalized with many junction tables)
- **MongoDB**: 9 collections (denormalized with embedded documents)

### Differences

1. **Relationships**
   - **SQL**: Foreign keys and JOIN operations across multiple tables
   - **MongoDB**: Embedded documents and ObjectId references

2. **Data Structure**
   - **SQL**: Flat, normalized structure
   - **MongoDB**: Nested, hierarchical structure

3. **Query Complexity**
   - **SQL**: Complex JOINs required for related data
   - **MongoDB**: Single document contains related data (no JOINs needed)

4. **Scalability**
   - **SQL**: Vertical scaling (bigger server)
   - **MongoDB**: Horizontal scaling (more servers)

5. **Schema Flexibility**
   - **SQL**: Fixed schema, requires ALTER TABLE for changes
   - **MongoDB**: Flexible schema, can add fields anytime

---

## Part 3: Neo4j Graph Database Schema (Graph-Based)

Neo4j uses a graph data model with **Nodes** (entities), **Relationships** (connections), and **Properties** (attributes).

### Node Labels and Properties

#### 1. User Node
```cypher
// Create User node with all properties
CREATE (u:User {
  id: "user_001",
  username: "john_doe",
  email: "john@example.com",
  full_name: "John Doe",
  password: "$2b$10$...", // hashed
  password_last_changed: datetime("2025-01-15T10:00:00Z"),
  role: "analyst",
  organization: "EMSI",
  department: "Security",
  job_title: "Security Analyst",
  phone: "+212612345678",
  office_location: "Casablanca",
  is_active: true,
  is_verified: true,
  is_locked: false,
  last_login: datetime("2025-01-20T14:30:00Z"),
  last_login_ip: "192.168.1.100",
  login_count: 150,
  failed_login_attempts: 0,
  two_factor_enabled: false,
  api_token: "token_here",
  api_token_created: datetime("2025-01-01T00:00:00Z"),
  api_token_expires: datetime("2026-01-01T00:00:00Z"),
  avatar_url: "https://...",
  bio: "Security analyst with 5 years experience",
  gdpr_consent: true,
  gdpr_consent_date: datetime("2025-01-01T00:00:00Z"),
  terms_accepted: true,
  terms_accepted_date: datetime("2025-01-01T00:00:00Z"),
  created_at: datetime("2025-01-01T00:00:00Z"),
  updated_at: datetime("2025-01-20T15:00:00Z"),
  // Preferences as properties
  language: "en",
  timezone: "Africa/Casablanca",
  theme: "dark",
  email_notifications: true,
  // Statistics as properties
  attacks_created: 45,
  attacks_resolved: 38,
  reports_generated: 12,
  alerts_acknowledged: 89
})

// Create indexes for User
CREATE INDEX user_id_index FOR (u:User) ON (u.id);
CREATE INDEX user_username_index FOR (u:User) ON (u.username);
CREATE INDEX user_email_index FOR (u:User) ON (u.email);
CREATE INDEX user_role_index FOR (u:User) ON (u.role);
```

#### 2. Attack Node
```cypher
// Create Attack node
CREATE (a:Attack {
  id: "attack_001",
  type: "Phishing",
  subtype: "Spear Phishing",
  source_ip: "185.122.54.90",
  source_country: "Russia",
  source_asn: "AS12345",
  source_isp: "Evil Corp ISP",
  target_country: "Morocco",
  target_org: "EMSI",
  target_sector: "Education",
  date: datetime("2025-01-19T12:30:00Z"),
  detected_at: datetime("2025-01-19T12:35:00Z"),
  duration_seconds: 3600,
  timezone: "Africa/Casablanca",
  severity: "High",
  severity_score: 8.5,
  cvss_score: 8.3,
  confidence_level: 95,
  data_loss: 5000,
  financial_impact: 50000,
  affected_users: 1200,
  downtime_minutes: 240,
  description: "Sophisticated phishing campaign...",
  attack_vector: "Email with malicious attachment",
  attack_pattern: "MITRE ATT&CK: T1566.001",
  status: "Mitigated",
  priority: "High",
  reported_at: datetime("2025-01-19T12:40:00Z"),
  verified: true,
  gdpr_relevant: true,
  law_enforcement_notified: false,
  notification_required: true,
  breach_notification_date: datetime("2025-01-20T00:00:00Z"),
  source: "Manual Report",
  source_reliability: "A",
  processed: true,
  enriched: true,
  last_enrichment: datetime("2025-01-19T13:00:00Z"),
  created_at: datetime("2025-01-19T12:30:00Z"),
  updated_at: datetime("2025-01-19T13:00:00Z")
})

// Create indexes for Attack
CREATE INDEX attack_id_index FOR (a:Attack) ON (a.id);
CREATE INDEX attack_type_index FOR (a:Attack) ON (a.type);
CREATE INDEX attack_severity_index FOR (a:Attack) ON (a.severity);
CREATE INDEX attack_status_index FOR (a:Attack) ON (a.status);
CREATE INDEX attack_date_index FOR (a:Attack) ON (a.date);
CREATE INDEX attack_source_ip_index FOR (a:Attack) ON (a.source_ip);
```

#### 3. IP Node
```cypher
// Create IP node
CREATE (ip:IP {
  id: "ip_001",
  ip_address: "185.122.54.90",
  ip_version: 4,
  country: "Russia",
  country_code: "RU",
  city: "Moscow",
  region: "Moscow",
  postal_code: "101000",
  latitude: 55.7558,
  longitude: 37.6173,
  isp: "Evil Corp ISP",
  organization: "Evil Corp",
  asn: "AS12345",
  asn_name: "Evil Corp ASN",
  reported_count: 15,
  attack_count: 12,
  first_seen: datetime("2025-01-01T00:00:00Z"),
  last_report: datetime("2025-01-19T12:30:00Z"),
  last_activity: datetime("2025-01-19T12:30:00Z"),
  threat_score: 85,
  reputation_score: 15,
  risk_level: "High",
  is_blacklisted: true,
  blacklisted_at: datetime("2025-01-10T00:00:00Z"),
  blacklist_reason: "Multiple phishing attacks detected",
  registrar: "Registrar Inc",
  whois_created_date: datetime("2020-01-01T00:00:00Z"),
  whois_updated_date: datetime("2024-12-01T00:00:00Z"),
  whois_expiry_date: datetime("2026-01-01T00:00:00Z"),
  registrant: "Evil Corp",
  is_active: true,
  is_tor_exit_node: false,
  is_proxy: false,
  is_vpn: false,
  notes: "Known malicious IP, block immediately",
  created_at: datetime("2025-01-01T00:00:00Z"),
  updated_at: datetime("2025-01-19T12:30:00Z"),
  last_enrichment: datetime("2025-01-19T12:00:00Z")
})

// VirusTotal data as separate node (or properties)
CREATE (vt:VirusTotalData {
  last_analysis_date: datetime("2025-01-19T10:00:00Z"),
  malicious: 45,
  suspicious: 5,
  harmless: 10,
  undetected: 0,
  reputation: -50,
  url: "https://virustotal.com/..."
})

// AbuseIPDB data as separate node
CREATE (ab:AbuseIPDBData {
  abuse_confidence_score: 100,
  total_reports: 150,
  num_distinct_users: 45,
  last_reported: datetime("2025-01-19T12:00:00Z"),
  country_code: "RU"
})

// Create indexes for IP
CREATE INDEX ip_address_index FOR (ip:IP) ON (ip.ip_address);
CREATE INDEX ip_threat_score_index FOR (ip:IP) ON (ip.threat_score);
CREATE INDEX ip_is_blacklisted_index FOR (ip:IP) ON (ip.is_blacklisted);
CREATE INDEX ip_country_index FOR (ip:IP) ON (ip.country);
```

#### 4. Source Node
```cypher
// Create Source node
CREATE (s:Source {
  id: "source_001",
  name: "VirusTotal",
  display_name: "VirusTotal API",
  type: "API",
  category: "Threat Intelligence",
  api_endpoint: "https://www.virustotal.com/api/v3",
  api_key: "encrypted_key_here",
  api_version: "v3",
  authentication_method: "API_KEY",
  sync_enabled: true,
  sync_interval: 3600,
  last_sync: datetime("2025-01-20T10:00:00Z"),
  next_sync: datetime("2025-01-20T11:00:00Z"),
  sync_status: "Success",
  records_collected: 50000,
  total_syncs: 1000,
  successful_syncs: 980,
  failed_syncs: 20,
  average_response_time: 1.5,
  is_active: true,
  reliability_score: 95,
  data_quality_score: 90,
  error_count: 5,
  consecutive_errors: 0,
  max_consecutive_errors: 5,
  rate_limit: 500,
  rate_limit_period: "minute",
  current_usage: 45,
  rate_limit_reset: datetime("2025-01-20T11:00:00Z"),
  timeout: 30000,
  documentation_url: "https://docs.virustotal.com",
  support_email: "support@virustotal.com",
  terms_of_service_url: "https://virustotal.com/terms",
  created_at: datetime("2025-01-01T00:00:00Z"),
  updated_at: datetime("2025-01-20T10:00:00Z")
})

// Create indexes for Source
CREATE INDEX source_id_index FOR (s:Source) ON (s.id);
CREATE INDEX source_name_index FOR (s:Source) ON (s.name);
CREATE INDEX source_type_index FOR (s:Source) ON (s.type);
```

#### 5. Report Node
```cypher
// Create Report node
CREATE (r:Report {
  id: "report_001",
  title: "Monthly Security Report - January 2025",
  report_type: "Monthly",
  report_id: "RPT-2025-01",
  start_date: datetime("2025-01-01T00:00:00Z"),
  end_date: datetime("2025-01-31T23:59:59Z"),
  summary: "This report covers all security incidents...",
  executive_summary: "During January 2025, we detected...",
  detailed_analysis: "Detailed analysis of all incidents...",
  format: "PDF",
  file_path: "/reports/RPT-2025-01.pdf",
  file_size: 2048000,
  generated_at: datetime("2025-02-01T00:00:00Z"),
  generation_time_seconds: 45,
  is_public: false,
  access_count: 15,
  last_accessed: datetime("2025-02-05T10:00:00Z"),
  notes: "Report generated automatically",
  version: 1,
  created_at: datetime("2025-02-01T00:00:00Z"),
  updated_at: datetime("2025-02-01T00:00:00Z"),
  // Statistics as properties
  total_attacks: 150,
  financial_impact: 500000,
  affected_users: 5000
})

// Create indexes for Report
CREATE INDEX report_id_index FOR (r:Report) ON (r.id);
CREATE INDEX report_type_index FOR (r:Report) ON (r.report_type);
CREATE INDEX report_generated_at_index FOR (r:Report) ON (r.generated_at);
```

#### 6. Alert Node
```cypher
// Create Alert node
CREATE (al:Alert {
  id: "alert_001",
  title: "Critical Severity Attack Detected",
  alert_type: "Critical Severity",
  severity: "Critical",
  description: "A critical severity attack has been detected...",
  message: "Immediate action required",
  source_type: "Attack",
  status: "Active",
  notifications_sent: true,
  priority: "Critical",
  expires_at: datetime("2025-01-20T12:35:00Z"),
  auto_resolve: false,
  created_at: datetime("2025-01-19T12:35:00Z"),
  updated_at: datetime("2025-01-19T12:35:00Z")
})

// Create indexes for Alert
CREATE INDEX alert_id_index FOR (al:Alert) ON (al.id);
CREATE INDEX alert_status_index FOR (al:Alert) ON (al.status);
CREATE INDEX alert_severity_index FOR (al:Alert) ON (al.severity);
CREATE INDEX alert_type_index FOR (al:Alert) ON (al.alert_type);
```

#### 7. ThreatIntelligence Node
```cypher
// Create ThreatIntelligence node
CREATE (ti:ThreatIntelligence {
  id: "ti_001",
  indicator: "185.122.54.90",
  indicator_type: "ip",
  threat_type: "Malware",
  threat_family: "TrickBot",
  threat_actor: "APT28",
  threat_score: 90,
  confidence_level: 95,
  reputation: "Malicious",
  is_active: true,
  first_seen: datetime("2025-01-01T00:00:00Z"),
  last_seen: datetime("2025-01-19T12:30:00Z"),
  expires_at: datetime("2026-01-01T00:00:00Z"),
  description: "Known malicious IP associated with TrickBot",
  context: "This IP has been used in multiple phishing campaigns",
  kill_chain_phase: "Command and Control",
  created_at: datetime("2025-01-01T00:00:00Z"),
  updated_at: datetime("2025-01-19T12:30:00Z")
})

// Create indexes for ThreatIntelligence
CREATE INDEX threat_intel_id_index FOR (ti:ThreatIntelligence) ON (ti.id);
CREATE INDEX threat_intel_indicator_index FOR (ti:ThreatIntelligence) ON (ti.indicator);
CREATE INDEX threat_intel_type_index FOR (ti:ThreatIntelligence) ON (ti.indicator_type);
CREATE INDEX threat_intel_score_index FOR (ti:ThreatIntelligence) ON (ti.threat_score);
```

#### 8. Vulnerability Node
```cypher
// Create Vulnerability node
CREATE (v:Vulnerability {
  id: "vuln_001",
  cve_id: "CVE-2024-1234",
  cwe_id: "CWE-79",
  title: "Cross-Site Scripting (XSS) vulnerability",
  description: "A cross-site scripting vulnerability allows...",
  summary: "XSS vulnerability in web application",
  cvss_score: 8.3,
  cvss_version: "3.1",
  cvss_vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H",
  base_score: 8.3,
  temporal_score: 7.5,
  environmental_score: 8.0,
  severity: "High",
  exploitability_score: 2.8,
  impact_score: 5.9,
  published_date: datetime("2024-01-15T00:00:00Z"),
  modified_date: datetime("2024-12-01T00:00:00Z"),
  assigned_date: datetime("2024-01-10T00:00:00Z"),
  is_exploited: true,
  exploited_in_attacks: 5,
  exploit_available: true,
  exploit_maturity: "Functional",
  patch_available: true,
  remediation: "Update to version 1.1 or apply patch",
  attack_pattern: "T1059.007",
  source: "NVD",
  source_url: "https://nvd.nist.gov/vuln/detail/CVE-2024-1234",
  created_at: datetime("2024-01-15T00:00:00Z"),
  updated_at: datetime("2024-12-01T00:00:00Z")
})

// Create indexes for Vulnerability
CREATE INDEX vulnerability_id_index FOR (v:Vulnerability) ON (v.id);
CREATE INDEX vulnerability_cve_index FOR (v:Vulnerability) ON (v.cve_id);
CREATE INDEX vulnerability_cvss_index FOR (v:Vulnerability) ON (v.cvss_score);
CREATE INDEX vulnerability_severity_index FOR (v:Vulnerability) ON (v.severity);
```

#### 9. AuditLog Node
```cypher
// Create AuditLog node
CREATE (audit:AuditLog {
  id: "audit_001",
  action: "UPDATE",
  resource_type: "Attack",
  username: "john_doe",
  ip_address: "192.168.1.100",
  user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  description: "Updated attack status from 'Detected' to 'Mitigated'",
  status: "Success",
  error_message: null,
  timestamp: datetime("2025-01-19T13:00:00Z"),
  duration_ms: 45,
  risk_level: "Low",
  is_suspicious: false
})

// Create indexes for AuditLog
CREATE INDEX audit_log_id_index FOR (audit:AuditLog) ON (audit.id);
CREATE INDEX audit_log_timestamp_index FOR (audit:AuditLog) ON (audit.timestamp);
CREATE INDEX audit_log_action_index FOR (audit:AuditLog) ON (audit.action);
CREATE INDEX audit_log_resource_type_index FOR (audit:AuditLog) ON (audit.resource_type);
```

### Relationships Between Nodes

```cypher
// 1. User Relationships
// User CREATED_BY User (self-referential)
MATCH (creator:User {id: "user_001"}), (created:User {id: "user_002"})
CREATE (created)-[:CREATED_BY]->(creator);

// User REPORTED Attack
MATCH (u:User {id: "user_001"}), (a:Attack {id: "attack_001"})
CREATE (a)-[:REPORTED_BY {reported_at: datetime("2025-01-19T12:40:00Z")}]->(u);

// User ASSIGNED_TO Attack
MATCH (u:User {id: "user_001"}), (a:Attack {id: "attack_001"})
CREATE (a)-[:ASSIGNED_TO {assigned_at: datetime("2025-01-19T12:45:00Z")}]->(u);

// User VERIFIED Attack
MATCH (u:User {id: "user_001"}), (a:Attack {id: "attack_001"})
CREATE (a)-[:VERIFIED_BY {verified_at: datetime("2025-01-19T12:50:00Z")}]->(u);

// User GENERATED Report
MATCH (u:User {id: "user_001"}), (r:Report {id: "report_001"})
CREATE (r)-[:GENERATED_BY {generated_at: datetime("2025-02-01T00:00:00Z")}]->(u);

// User ACKNOWLEDGED Alert
MATCH (u:User {id: "user_001"}), (al:Alert {id: "alert_001"})
CREATE (al)-[:ACKNOWLEDGED_BY {acknowledged_at: datetime("2025-01-19T13:00:00Z")}]->(u);

// User RESOLVED Alert
MATCH (u:User {id: "user_001"}), (al:Alert {id: "alert_001"})
CREATE (al)-[:RESOLVED_BY {resolved_at: datetime("2025-01-19T14:00:00Z")}]->(u);

// User CREATED ThreatIntelligence
MATCH (u:User {id: "user_001"}), (ti:ThreatIntelligence {id: "ti_001"})
CREATE (ti)-[:CREATED_BY {created_at: datetime("2025-01-01T00:00:00Z")}]->(u);

// User PERFORMED AuditLog
MATCH (u:User {id: "user_001"}), (audit:AuditLog {id: "audit_001"})
CREATE (audit)-[:PERFORMED_BY]->(u);

// User SHARED_WITH Report
MATCH (u1:User {id: "user_001"}), (u2:User {id: "user_002"}), (r:Report {id: "report_001"})
CREATE (r)-[:SHARED_WITH {shared_at: datetime("2025-02-01T10:00:00Z")}]->(u2);

// 2. Attack Relationships
// Attack ORIGINATED_FROM IP
MATCH (a:Attack {id: "attack_001"}), (ip:IP {id: "ip_001"})
CREATE (a)-[:ORIGINATED_FROM {source_ip: "185.122.54.90"}]->(ip);

// Attack RELATED_TO Attack
MATCH (a1:Attack {id: "attack_001"}), (a2:Attack {id: "attack_002"})
CREATE (a1)-[:RELATED_TO {relation_type: "same_campaign", confidence: 0.95}]->(a2);

// Attack EXPLOITS Vulnerability
MATCH (a:Attack {id: "attack_001"}), (v:Vulnerability {id: "vuln_001"})
CREATE (a)-[:EXPLOITS {exploited_at: datetime("2025-01-19T12:30:00Z")}]->(v);

// Attack USES ThreatIntelligence
MATCH (a:Attack {id: "attack_001"}), (ti:ThreatIntelligence {id: "ti_001"})
CREATE (a)-[:USES {detected_at: datetime("2025-01-19T12:30:00Z")}]->(ti);

// Attack TRIGGERED Alert
MATCH (a:Attack {id: "attack_001"}), (al:Alert {id: "alert_001"})
CREATE (al)-[:TRIGGERED_BY {triggered_at: datetime("2025-01-19T12:35:00Z")}]->(a);

// Attack INCLUDED_IN Report
MATCH (a:Attack {id: "attack_001"}), (r:Report {id: "report_001"})
CREATE (a)-[:INCLUDED_IN {included_at: datetime("2025-02-01T00:00:00Z")}]->(r);

// 3. IP Relationships
// IP ASSOCIATED_WITH IP (same ASN, same organization, etc.)
MATCH (ip1:IP {id: "ip_001"}), (ip2:IP {id: "ip_002"})
CREATE (ip1)-[:ASSOCIATED_WITH {association_type: "same_asn", asn: "AS12345"}]->(ip2);

// IP ENRICHED_BY Source
MATCH (ip:IP {id: "ip_001"}), (s:Source {id: "source_001"})
CREATE (ip)-[:ENRICHED_BY {enriched_at: datetime("2025-01-19T12:00:00Z")}]->(s);

// IP HAS VirusTotalData
MATCH (ip:IP {id: "ip_001"}), (vt:VirusTotalData)
CREATE (ip)-[:HAS_VIRUSTOTAL_DATA]->(vt);

// IP HAS AbuseIPDBData
MATCH (ip:IP {id: "ip_001"}), (ab:AbuseIPDBData)
CREATE (ip)-[:HAS_ABUSEIPDB_DATA]->(ab);

// IP TRIGGERED Alert
MATCH (ip:IP {id: "ip_001"}), (al:Alert {id: "alert_002"})
CREATE (al)-[:TRIGGERED_BY {triggered_at: datetime("2025-01-19T12:30:00Z")}]->(ip);

// 4. ThreatIntelligence Relationships
// ThreatIntelligence RELATED_TO ThreatIntelligence
MATCH (ti1:ThreatIntelligence {id: "ti_001"}), (ti2:ThreatIntelligence {id: "ti_002"})
CREATE (ti1)-[:RELATED_TO {relation_type: "same_family", confidence: 0.90}]->(ti2);

// ThreatIntelligence MATCHES IP
MATCH (ti:ThreatIntelligence {id: "ti_001"}), (ip:IP {id: "ip_001"})
CREATE (ti)-[:MATCHES {matched_at: datetime("2025-01-01T00:00:00Z")}]->(ip);

// ThreatIntelligence SOURCED_FROM Source
MATCH (ti:ThreatIntelligence {id: "ti_001"}), (s:Source {id: "source_001"})
CREATE (ti)-[:SOURCED_FROM {first_seen: datetime("2025-01-01T00:00:00Z"), detection_count: 45}]->(s);

// 5. Vulnerability Relationships
// Vulnerability EXPLOITED_BY Attack
MATCH (v:Vulnerability {id: "vuln_001"}), (a:Attack {id: "attack_001"})
CREATE (a)-[:EXPLOITS {exploited_at: datetime("2025-01-19T12:30:00Z")}]->(v);

// Vulnerability AFFECTS Product (as separate node or property)
CREATE (p:Product {
  vendor: "Example Corp",
  product: "WebApp",
  version: "1.0"
})
MATCH (v:Vulnerability {id: "vuln_001"}), (p:Product)
CREATE (v)-[:AFFECTS {severity: "High"}]->(p);

// 6. Report Relationships
// Report CONTAINS Attack (implicit through INCLUDED_IN relationship)

// 7. Alert Relationships
// Alert REFERENCES Attack or IP (through TRIGGERED_BY relationship)

// 8. AuditLog Relationships
// AuditLog LOGS_ACTION_ON Attack/User/IP/etc.
MATCH (audit:AuditLog {id: "audit_001"}), (a:Attack {id: "attack_001"})
CREATE (audit)-[:LOGS_ACTION_ON {action: "UPDATE"}]->(a);
```

### Some Cypher Queries

#### Find all attacks reported by a user
```cypher
MATCH (u:User {username: "john_doe"})<-[:REPORTED_BY]-(a:Attack)
RETURN a.type, a.severity, a.date, a.status
ORDER BY a.date DESC;
```

#### Find all attacks from a specific IP with related data
```cypher
MATCH (ip:IP {ip_address: "185.122.54.90"})<-[:ORIGINATED_FROM]-(a:Attack)
MATCH (a)-[:REPORTED_BY]->(u:User)
MATCH (a)-[:ASSIGNED_TO]->(analyst:User)
OPTIONAL MATCH (a)-[:EXPLOITS]->(v:Vulnerability)
OPTIONAL MATCH (a)-[:USES]->(ti:ThreatIntelligence)
RETURN a, u, analyst, collect(v) as vulnerabilities, collect(ti) as indicators;
```

#### Find attack patterns (related attacks)
```cypher
MATCH (a1:Attack)-[:RELATED_TO]->(a2:Attack)
WHERE a1.type = "Phishing" AND a2.type = "Phishing"
RETURN a1, a2, a1.campaign_id, a2.campaign_id;
```

#### Find all high-threat IPs and their attack chains
```cypher
MATCH path = (ip:IP {is_blacklisted: true})<-[:ORIGINATED_FROM]-(a:Attack)-[:EXPLOITS]->(v:Vulnerability)
WHERE ip.threat_score > 80
RETURN path, ip, a, v
ORDER BY ip.threat_score DESC
LIMIT 50;
```

#### Find users who reported attacks that were later mitigated
```cypher
MATCH (u:User)<-[:REPORTED_BY]-(a:Attack {status: "Mitigated"})
MATCH (a)-[:ASSIGNED_TO]->(analyst:User)
RETURN u.username, analyst.username, count(a) as mitigated_attacks
ORDER BY mitigated_attacks DESC;
```

#### Find threat intelligence network (related indicators)
```cypher
MATCH path = (ti1:ThreatIntelligence)-[:RELATED_TO*1..3]-(ti2:ThreatIntelligence)
WHERE ti1.threat_family = "TrickBot"
RETURN path, ti1, ti2;
```

#### Find all vulnerabilities exploited in attacks
```cypher
MATCH (v:Vulnerability)<-[:EXPLOITS]-(a:Attack)
WHERE v.is_exploited = true
RETURN v.cve_id, v.severity, count(a) as attack_count, 
       collect(DISTINCT a.type) as attack_types
ORDER BY attack_count DESC;
```

#### Find attack timeline for a specific campaign
```cypher
MATCH (a1:Attack {campaign_id: "CAMP-2025-001"})-[:RELATED_TO*0..]-(a2:Attack)
RETURN a1, a2, a1.date, a2.date
ORDER BY a1.date, a2.date;
```

#### Find all alerts triggered by high-severity attacks
```cypher
MATCH (a:Attack {severity: "Critical"})<-[:TRIGGERED_BY]-(al:Alert)
MATCH (al)-[:ACKNOWLEDGED_BY]->(u:User)
RETURN a, al, u.username, al.acknowledged_at
ORDER BY al.created_at DESC;
```

#### Find IP enrichment chain
```cypher
MATCH (ip:IP {ip_address: "185.122.54.90"})
MATCH (ip)-[:HAS_VIRUSTOTAL_DATA]->(vt:VirusTotalData)
MATCH (ip)-[:HAS_ABUSEIPDB_DATA]->(ab:AbuseIPDBData)
MATCH (ip)-[:ENRICHED_BY]->(s:Source)
RETURN ip, vt, ab, s;
```

### Summary: SQL vs MongoDB vs Neo4j Comparison

| Aspect | SQL (Relational) | MongoDB (Document) | Neo4j (Graph) |
|--------|------------------|-------------------|---------------|
| **Data Model** | Tables with rows | Collections with documents | Nodes with relationships |
| **Relationships** | Foreign keys + JOINs | Embedded docs + References | First-class relationships |
| **Query Language** | SQL | MongoDB Query Language | Cypher |
| **Schema** | Fixed, normalized | Flexible, denormalized | Flexible, schema-optional |
| **Relationships** | Implicit (JOINs) | Embedded or references | Explicit (edges) |
| **Traversal** | Complex JOINs | Manual lookups | Native graph traversal |
| **Use Case** | Structured data, ACID | Flexible documents, high volume | Connected data, relationships |
| **Scaling** | Vertical | Horizontal | Horizontal (clustering) |
| **Total Entities** | 100+ tables | 9 collections | 9 node types + relationships |

### Key Advantages of Neo4j for This Project

1. **Relationship Queries**: Find attack chains, related IPs, and threat networks easily
2. **Pattern Matching**: Discover attack patterns and campaigns through graph traversal
3. **Real-time Analysis**: Traverse relationships in real-time without complex JOINs
4. **Visualization**: Graph structure is naturally visualizable
5. **Recommendations**: Find similar attacks, related threats, and attack patterns
6. **Network Analysis**: Analyze IP relationships, threat actor networks, and attack propagation


The Neo4j query is more intuitive and performs better for relationship-heavy queries.
