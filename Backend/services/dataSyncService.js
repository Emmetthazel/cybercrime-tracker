const Source = require('../models/Source');
const Attack = require('../models/Attack');
const IP = require('../models/IP');
const ThreatIntelligence = require('../models/ThreatIntelligence');
const externalAPIService = require('./externalAPIService');
const AuditLog = require('../models/AuditLog');

/**
 * Service de synchronisation des données depuis les sources externes
 * Transforme les données des APIs en incidents et les enregistre dans MongoDB
 */

class DataSyncService {
  constructor() {
    this.deduplicationWindow = 24 * 60 * 60 * 1000; // 24 heures en millisecondes
  }

  /**
   * Synchronise une source spécifique
   */
  async syncSource(sourceId) {
    try {
      const source = await Source.findById(sourceId);
      
      if (!source) {
        throw new Error(`Source not found: ${sourceId}`);
      }

      if (!source.sync_enabled || !source.is_active) {
        return {
          success: false,
          message: 'Source is disabled or inactive',
          source: source.name
        };
      }

      // Mettre à jour le statut de synchronisation
      source.sync_status = 'In Progress';
      source.last_sync = new Date();
      await source.save();

      let syncResult;
      const startTime = Date.now();

      try {
        // Récupérer les données depuis l'API
        const feedData = await externalAPIService.fetchThreatIntelligenceFeeds(source);
        
        // Transformer les données selon le mapping configuré
        const transformedData = this.transformData(feedData, source);
        
        // Créer les incidents
        syncResult = await this.createIncidentsFromData(transformedData, source);
        
        // Calculer le temps de réponse
        const responseTime = (Date.now() - startTime) / 1000;
        
        // Mettre à jour les statistiques de la source
        source.sync_status = 'Success';
        source.total_syncs = (source.total_syncs || 0) + 1;
        source.successful_syncs = (source.successful_syncs || 0) + 1;
        source.records_collected = (source.records_collected || 0) + (syncResult.created || 0);
        source.average_response_time = this.calculateAverageResponseTime(
          source.average_response_time,
          responseTime,
          source.total_syncs
        );
        source.next_sync = new Date(Date.now() + source.sync_interval * 1000);
        source.error_count = 0;
        source.consecutive_errors = 0;
        source.last_error = null;
        source.last_error_date = null;
        
        await source.save();

        return {
          success: true,
          source: source.name,
          created: syncResult.created,
          skipped: syncResult.skipped,
          errors: syncResult.errors,
          responseTime
        };
      } catch (error) {
        // Gérer les erreurs
        const errorMessage = error.message || 'Unknown error occurred';
        
        source.sync_status = 'Failed';
        source.total_syncs = (source.total_syncs || 0) + 1;
        source.failed_syncs = (source.failed_syncs || 0) + 1;
        source.error_count = (source.error_count || 0) + 1;
        source.consecutive_errors = (source.consecutive_errors || 0) + 1;
        source.last_error = errorMessage;
        source.last_error_date = new Date();
        
        // Désactiver la source si trop d'erreurs consécutives
        if (source.consecutive_errors >= (source.max_consecutive_errors || 5)) {
          source.is_active = false;
          console.warn(`Source ${source.name} has been deactivated due to ${source.consecutive_errors} consecutive errors`);
        }
        
        await source.save();

        // Re-throw avec un message plus clair
        throw new Error(`Sync failed for ${source.name}: ${errorMessage}`);
      }
    } catch (error) {
      console.error(`Sync error for source ${sourceId}:`, error);
      return {
        success: false,
        source: sourceId,
        error: error.message
      };
    }
  }

  /**
   * Synchronise toutes les sources actives
   */
  async syncAllSources() {
    try {
      const sources = await Source.find({
        sync_enabled: true,
        is_active: true
      });

      const results = [];
      
      for (const source of sources) {
        // Vérifier si c'est le moment de synchroniser
        const now = new Date();
        if (source.next_sync && source.next_sync > now) {
          continue;
        }

        const result = await this.syncSource(source._id);
        results.push(result);
        
        // Attendre un peu entre les synchronisations pour éviter le rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      return {
        success: true,
        total: sources.length,
        results
      };
    } catch (error) {
      console.error('Error syncing all sources:', error);
      throw error;
    }
  }

  /**
   * Transforme les données brutes de l'API en format standardisé
   */
  transformData(feedData, source) {
    const { data, source: sourceName } = feedData;
    const mapping = source.data_mapping || {};
    
    // Si un mapping personnalisé est défini, l'utiliser
    if (mapping && Object.keys(mapping).length > 0) {
      return this.applyMapping(data, mapping);
    }

    // Sinon, utiliser des transformations par défaut selon le type de source
    return this.defaultTransform(data, sourceName, source.type);
  }

  /**
   * Récupère une valeur imbriquée depuis un objet en utilisant un chemin (ex: "user.profile.name")
   */
  getNestedValue(obj, path) {
    if (!path) return undefined;
    
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[key];
    }
    
    return value;
  }

  /**
   * Applique un mapping personnalisé aux données
   */
  applyMapping(data, mapping) {
    const transformed = [];
    
    // Supposons que data est un tableau d'objets
    const items = Array.isArray(data) ? data : (data.items || data.results || [data]);
    
    for (const item of items) {
      const transformedItem = {};
      
      for (const [targetField, sourcePath] of Object.entries(mapping)) {
        const value = this.getNestedValue(item, sourcePath);
        transformedItem[targetField] = value;
      }
      
      transformed.push(transformedItem);
    }
    
    return transformed;
  }

  /**
   * Transformation par défaut selon le type de source
   * Applique des règles intelligentes spécifiques à chaque API
   */
  defaultTransform(data, sourceName, sourceType) {
    const transformed = [];
    
    // Format générique pour les APIs de Threat Intelligence
    let items = [];
    
    if (Array.isArray(data)) {
      items = data;
    } else if (data.items) {
      items = data.items;
    } else if (data.results) {
      items = data.results;
    } else if (data.data) {
      items = Array.isArray(data.data) ? data.data : [data.data];
    } else {
      items = [data];
    }

    // Transformation spécifique selon la source
    if (sourceName && sourceName.toLowerCase().includes('shodan')) {
      return this.transformShodanData(items);
    } else if (sourceName && sourceName.toLowerCase().includes('abuseipdb')) {
      return this.transformAbuseIPDBData(items);
    } else if (sourceName && sourceName.toLowerCase().includes('virustotal')) {
      return this.transformVirusTotalData(items);
    } else if (sourceName && sourceName.toLowerCase().includes('otx')) {
      return this.transformOTXData(items);
    }

    // Transformation générique par défaut
    for (const item of items) {
      transformed.push({
        // Champs standardisés
        source_ip: item.ip || item.source_ip || item.ip_address || item.indicator,
        target_country: item.target_country || item.country || item.target || null,
        type: this.mapAttackType(item.type || item.category || item.threat_type || 'Other'),
        severity: this.mapSeverity(item.severity || item.risk_level || item.confidence || 'Medium'),
        description: item.description || item.summary || item.title || `Threat detected from ${item.ip || 'unknown'}`,
        date: this.parseDate(item.date || item.timestamp || item.created_at || item.first_seen),
        tags: this.extractTags(item),
        threat_actor: item.threat_actor || item.actor || null,
        confidence_level: item.confidence || item.confidence_score || 50,
        raw_data: item // Conserver les données brutes pour référence
      });
    }

    return transformed;
  }

  /**
   * Transformation spécifique pour Shodan
   * Applique des règles : ports sensibles, vulnérabilités, etc.
   */
  transformShodanData(items) {
    const transformed = [];
    const sensitivePorts = [22, 23, 3389, 445, 1433, 3306, 5432, 27017]; // SSH, Telnet, RDP, SMB, SQL, etc.

    for (const item of items) {
      const ip = item.ip_str || item.ip || item.ip_address;
      if (!ip) continue;

      const ports = item.ports || [];
      const vulns = item.vulns ? Object.keys(item.vulns) : [];
      const openPortsCount = ports.length;

      // Règles de transformation (comme suggéré par ChatGPT)
      let type = 'Other';
      let severity = 'Low';
      let description = `Shodan scan for ${ip}`;
      const tags = [];

      // Règle 1: Vulnérabilités CVE détectées = High severity
      if (vulns.length > 0) {
        type = 'Exploit';
        severity = 'High';
        description = `Vulnerabilities detected on ${ip}: ${vulns.slice(0, 3).join(', ')}`;
        tags.push('cve', 'vulnerability', 'exploit');
      }
      // Règle 2: Ports sensibles ouverts = Medium severity
      else if (ports.some(port => sensitivePorts.includes(port))) {
        const sensitiveOpen = ports.filter(p => sensitivePorts.includes(p));
        type = 'Exposed Services';
        severity = 'Medium';
        description = `Sensitive ports open on ${ip}: ${sensitiveOpen.join(', ')}`;
        tags.push('exposed_services', 'sensitive_ports');
      }
      // Règle 3: Beaucoup de ports ouverts = Suspicious
      else if (openPortsCount > 10) {
        type = 'Suspicious Activity';
        severity = 'Medium';
        description = `Multiple ports open on ${ip} (${openPortsCount} ports)`;
        tags.push('multiple_ports', 'suspicious');
      }
      // Règle 4: Service spécifique détecté
      else if (item.product || item.org) {
        type = 'Information Disclosure';
        severity = 'Low';
        description = `Service information exposed: ${item.product || 'Unknown'} (${item.org || 'Unknown org'})`;
        tags.push('information_disclosure');
      }

      transformed.push({
        source_ip: ip,
        target_country: item.country_name || null,
        type,
        severity,
        description,
        date: item.last_update ? new Date(item.last_update) : new Date(),
        tags: [...tags, ...(item.tags || [])],
        confidence_level: vulns.length > 0 ? 85 : (openPortsCount > 5 ? 60 : 40),
        raw_data: item,
        // Informations supplémentaires pour Shodan
        forensics_data: {
          open_ports: ports,
          vulnerabilities: vulns,
          services: item.data || [],
          organization: item.org || null
        }
      });
    }

    return transformed;
  }

  /**
   * Transformation spécifique pour AbuseIPDB
   */
  transformAbuseIPDBData(items) {
    const transformed = [];

    for (const item of items) {
      const ip = item.ipAddress || item.ip;
      if (!ip) continue;

      const abuseScore = item.abuseConfidenceScore || item.abuse_confidence_score || 0;
      const totalReports = item.totalReports || item.total_reports || 0;
      const categories = item.categories || [];

      // Règles de transformation
      let severity = 'Low';
      let type = 'Suspicious Activity';
      
      if (abuseScore >= 90) {
        severity = 'Critical';
        type = 'Malware';
      } else if (abuseScore >= 75) {
        severity = 'High';
        type = 'Phishing';
      } else if (abuseScore >= 50) {
        severity = 'Medium';
        type = 'Suspicious Activity';
      }

      const categoryNames = this.mapAbuseIPDBCategories(categories);
      const description = `AbuseIPDB reports: ${totalReports} reports, confidence ${abuseScore}%. Categories: ${categoryNames.join(', ')}`;

      transformed.push({
        source_ip: ip,
        target_country: item.countryCode || null,
        type,
        severity,
        description,
        date: item.lastReportedAt ? new Date(item.lastReportedAt) : new Date(),
        tags: ['abuseipdb', ...categoryNames],
        confidence_level: abuseScore,
        raw_data: item
      });
    }

    return transformed;
  }

  /**
   * Transformation spécifique pour VirusTotal
   */
  transformVirusTotalData(items) {
    const transformed = [];

    for (const item of items) {
      const ip = item.ip || item.ip_address || item.indicator;
      if (!ip) continue;

      const stats = item.last_analysis_stats || item.attributes?.last_analysis_stats || {};
      const malicious = stats.malicious || 0;
      const suspicious = stats.suspicious || 0;
      const total = malicious + suspicious;

      // Règles de transformation
      let severity = 'Low';
      let type = 'Suspicious Activity';
      
      if (malicious >= 5) {
        severity = 'High';
        type = 'Malware';
      } else if (malicious >= 2 || suspicious >= 5) {
        severity = 'Medium';
        type = 'Phishing';
      }

      const description = `VirusTotal: ${malicious} malicious, ${suspicious} suspicious detections for ${ip}`;

      transformed.push({
        source_ip: ip,
        target_country: item.country || item.attributes?.country || null,
        type,
        severity,
        description,
        date: item.last_analysis_date ? new Date(item.last_analysis_date * 1000) : new Date(),
        tags: ['virustotal', malicious > 0 ? 'malicious' : 'suspicious'],
        confidence_level: total > 0 ? Math.min(100, (malicious * 20) + (suspicious * 10)) : 30,
        raw_data: item
      });
    }

    return transformed;
  }

  /**
   * Transformation spécifique pour OTX (AlienVault)
   */
  transformOTXData(items) {
    const transformed = [];

    for (const item of items) {
      const ip = item.indicator || item.ip;
      if (!ip) continue;

      const pulseCount = item.pulse_info?.count || 0;
      const pulses = item.pulse_info?.pulses || [];

      // Règles de transformation
      let severity = 'Low';
      let type = 'Threat Intelligence';
      
      if (pulseCount >= 10) {
        severity = 'High';
        type = 'APT';
      } else if (pulseCount >= 5) {
        severity = 'Medium';
        type = 'Malware';
      }

      const threatTypes = pulses.map(p => p.name).slice(0, 3);
      const description = `OTX: ${pulseCount} threat intelligence pulses. Threats: ${threatTypes.join(', ')}`;

      transformed.push({
        source_ip: ip,
        target_country: null,
        type,
        severity,
        description,
        date: new Date(),
        tags: ['otx', 'threat_intelligence', ...threatTypes],
        confidence_level: Math.min(100, pulseCount * 10),
        raw_data: item
      });
    }

    return transformed;
  }

  /**
   * Mappe les catégories AbuseIPDB vers des noms lisibles
   */
  mapAbuseIPDBCategories(categories) {
    const categoryMap = {
      3: 'Fraud Orders',
      4: 'DDoS Attack',
      5: 'FTP Brute-Force',
      6: 'Ping of Death',
      7: 'Phishing',
      8: 'Fraud VoIP',
      9: 'Open Proxy',
      10: 'Web Spam',
      11: 'Email Spam',
      12: 'Blog Spam',
      13: 'VPN IP',
      14: 'Port Scan',
      15: 'Hacking',
      16: 'SQL Injection',
      17: 'Spoofing',
      18: 'Brute-Force',
      19: 'Bad Web Bot',
      20: 'Exploited Host',
      21: 'Web App Attack',
      22: 'SSH',
      23: 'IoT Targeted'
    };

    return categories.map(cat => categoryMap[cat] || `Category ${cat}`);
  }

  /**
   * Mappe les types d'attaques depuis différentes sources vers les types standardisés
   */
  mapAttackType(type) {
    if (!type) return 'Other';
    
    const typeLower = type.toLowerCase();
    
    const typeMap = {
      'phishing': 'Phishing',
      'ddos': 'DDoS',
      'dos': 'DDoS',
      'ransomware': 'Ransomware',
      'malware': 'Malware',
      'trojan': 'Malware',
      'virus': 'Malware',
      'sql injection': 'SQL Injection',
      'xss': 'XSS',
      'cross-site scripting': 'XSS',
      'brute force': 'Brute Force',
      'mitm': 'Man-in-the-Middle',
      'man-in-the-middle': 'Man-in-the-Middle',
      'apt': 'Other',
      'c2': 'Other',
      'botnet': 'Other'
    };

    for (const [key, value] of Object.entries(typeMap)) {
      if (typeLower.includes(key)) {
        return value;
      }
    }

    return 'Other';
  }

  /**
   * Mappe les niveaux de gravité
   */
  mapSeverity(severity) {
    if (!severity) return 'Medium';
    
    const severityLower = severity.toString().toLowerCase();
    
    if (severityLower.includes('critical') || severityLower.includes('high')) {
      return 'High';
    } else if (severityLower.includes('medium') || severityLower.includes('moderate')) {
      return 'Medium';
    } else if (severityLower.includes('low') || severityLower.includes('info')) {
      return 'Low';
    }
    
    // Si c'est un nombre, mapper selon un seuil
    const numSeverity = parseInt(severity);
    if (!isNaN(numSeverity)) {
      if (numSeverity >= 8) return 'Critical';
      if (numSeverity >= 6) return 'High';
      if (numSeverity >= 4) return 'Medium';
      return 'Low';
    }
    
    return 'Medium';
  }

  /**
   * Parse une date depuis différents formats
   */
  parseDate(dateValue) {
    if (!dateValue) return new Date();
    
    if (dateValue instanceof Date) {
      return dateValue;
    }
    
    if (typeof dateValue === 'number') {
      // Timestamp Unix (secondes ou millisecondes)
      return new Date(dateValue > 1000000000000 ? dateValue : dateValue * 1000);
    }
    
    if (typeof dateValue === 'string') {
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    
    return new Date();
  }

  /**
   * Extrait les tags depuis les données
   */
  extractTags(item) {
    const tags = [];
    
    if (item.tags && Array.isArray(item.tags)) {
      tags.push(...item.tags);
    }
    
    if (item.categories && Array.isArray(item.categories)) {
      tags.push(...item.categories.map(c => c.toString()));
    }
    
    if (item.malware_family) {
      tags.push(item.malware_family);
    }
    
    if (item.threat_family) {
      tags.push(item.threat_family);
    }
    
    return [...new Set(tags)]; // Supprimer les doublons
  }

  /**
   * Crée des incidents depuis les données transformées
   */
  async createIncidentsFromData(transformedData, source) {
    let created = 0;
    let skipped = 0;
    const errors = [];

    for (const item of transformedData) {
      try {
        // Vérifier la déduplication
        const isDuplicate = await this.isDuplicate(item, source);
        
        if (isDuplicate) {
          skipped++;
          continue;
        }

        // Créer ou mettre à jour l'IP
        const ip = await this.ensureIP(item.source_ip, source);
        
        // Créer l'incident
        const attack = new Attack({
          ...item,
          source: 'API Sync',
          source_id: source._id, // Lier l'incident à la source
          source_reliability: 'B',
          source_ip_ref: ip._id,
          reported_at: new Date(),
          status: 'Detected',
          processed: false,
          enriched: false
        });

        await attack.save();
        
        // Mettre à jour l'IP avec la référence à l'attaque
        ip.attacks.push(attack._id);
        ip.attack_count += 1;
        ip.last_activity = new Date();
        await ip.save();

        created++;
      } catch (error) {
        errors.push({
          item: item.source_ip || 'unknown',
          error: error.message
        });
        console.error('Error creating incident:', error);
      }
    }

    return { created, skipped, errors };
  }

  /**
   * Vérifie si un incident est un doublon
   */
  async isDuplicate(item, source) {
    const { source_ip, date, type } = item;
    
    // Chercher un incident similaire dans la fenêtre de déduplication
    const windowStart = new Date(date.getTime() - this.deduplicationWindow);
    
    const existing = await Attack.findOne({
      source_ip,
      type,
      date: {
        $gte: windowStart,
        $lte: date
      },
      source: 'API Sync'
    });

    return !!existing;
  }

  /**
   * S'assure qu'une IP existe dans la base de données
   */
  async ensureIP(ipAddress, source) {
    if (!ipAddress) {
      throw new Error('IP address is required');
    }

    let ip = await IP.findOne({ ip_address: ipAddress });
    
    if (!ip) {
      // Enrichir l'IP avec les APIs externes
      const enrichmentData = await externalAPIService.enrichIPData(ipAddress);
      
      ip = new IP({
        ip_address: ipAddress,
        country: enrichmentData.sources.abuseipdb?.data?.country_code || 
                 enrichmentData.sources.virustotal?.data?.country || null,
        isp: enrichmentData.sources.abuseipdb?.data?.isp || 
             enrichmentData.sources.shodan?.data?.isp || null,
        organization: enrichmentData.sources.shodan?.data?.organization || null,
        asn: enrichmentData.sources.shodan?.data?.asn || null,
        first_seen: new Date(),
        last_activity: new Date(),
        enrichment_sources: Object.keys(enrichmentData.sources),
        last_enrichment: new Date()
      });

      // Ajouter les données d'enrichissement
      if (enrichmentData.sources.virustotal) {
        ip.virustotal_data = {
          malicious: enrichmentData.sources.virustotal.data.malicious_count || 0,
          suspicious: enrichmentData.sources.virustotal.data.suspicious_count || 0,
          harmless: enrichmentData.sources.virustotal.data.harmless_count || 0,
          reputation: enrichmentData.sources.virustotal.data.reputation || 0,
          last_analysis_date: enrichmentData.sources.virustotal.data.last_analysis_date
        };
      }

      if (enrichmentData.sources.abuseipdb) {
        ip.abuseipdb_data = enrichmentData.sources.abuseipdb.data;
        ip.threat_score = enrichmentData.sources.abuseipdb.data.abuse_confidence_score || 0;
        ip.reported_count = enrichmentData.sources.abuseipdb.data.total_reports || 0;
      }

      if (enrichmentData.sources.shodan) {
        ip.shodan_data = {
          last_scan: enrichmentData.sources.shodan.data.last_update,
          hostnames: enrichmentData.sources.shodan.data.hostnames || [],
          tags: [],
          vulns: enrichmentData.sources.shodan.data.vulns || []
        };
        ip.open_ports = enrichmentData.sources.shodan.data.ports || [];
        ip.services = enrichmentData.sources.shodan.data.services || [];
      }

      await ip.save();
    } else {
      // Mettre à jour les statistiques
      ip.reported_count += 1;
      ip.last_activity = new Date();
      await ip.save();
    }

    return ip;
  }

  /**
   * Calcule la moyenne du temps de réponse
   */
  calculateAverageResponseTime(currentAverage, newTime, totalSyncs) {
    if (!currentAverage) return newTime;
    return ((currentAverage * (totalSyncs - 1)) + newTime) / totalSyncs;
  }

  /**
   * Valide les données avant de les enregistrer
   */
  validateData(item) {
    const errors = [];
    
    if (!item.source_ip) {
      errors.push('source_ip is required');
    }
    
    if (!item.type) {
      errors.push('type is required');
    }
    
    if (!item.date) {
      errors.push('date is required');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Déduplique les données dans une collection
   */
  async deduplicateData(collectionName) {
    // Implémentation de la déduplication
    // À compléter selon les besoins
    console.log(`Deduplication for ${collectionName} not yet implemented`);
  }
}

module.exports = new DataSyncService();
