const axios = require('axios');
const config = require('../../Configuration/config/config');

/**
 * Service pour interagir avec les APIs externes de Threat Intelligence
 * Supporte: VirusTotal, AbuseIPDB, Shodan, OTX, AlienVault
 */

class ExternalAPIService {
  constructor() {
    this.timeout = 30000; // 30 secondes
    this.retryConfig = {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2
    };
  }

  /**
   * Effectue une requête HTTP avec retry automatique
   */
  async makeRequest(url, options = {}) {
    const { maxRetries, retryDelay, backoffMultiplier } = this.retryConfig;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios({
          url,
          timeout: this.timeout,
          ...options
        });
        return response.data;
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          const delay = retryDelay * Math.pow(backoffMultiplier, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  }

  /**
   * VirusTotal API - Récupère les rapports sur une IP, domaine, hash, etc.
   */
  async fetchFromVirusTotal(indicator, indicatorType = 'ip') {
    try {
      const apiKey = process.env.VIRUSTOTAL_API_KEY || config.VIRUSTOTAL_API_KEY;
      if (!apiKey) {
        throw new Error('VirusTotal API key not configured');
      }

      let endpoint;
      switch (indicatorType.toLowerCase()) {
        case 'ip':
          endpoint = `https://www.virustotal.com/api/v3/ip_addresses/${indicator}`;
          break;
        case 'domain':
          endpoint = `https://www.virustotal.com/api/v3/domains/${indicator}`;
          break;
        case 'hash':
        case 'file':
          endpoint = `https://www.virustotal.com/api/v3/files/${indicator}`;
          break;
        case 'url':
          // Pour les URLs, il faut d'abord les soumettre
          endpoint = `https://www.virustotal.com/api/v3/urls/${Buffer.from(indicator).toString('base64').replace(/=/g, '')}`;
          break;
        default:
          throw new Error(`Unsupported indicator type: ${indicatorType}`);
      }

      const data = await this.makeRequest(endpoint, {
        method: 'GET',
        headers: {
          'x-apikey': apiKey
        }
      });

      return {
        source: 'VirusTotal',
        indicator,
        indicatorType,
        data: {
          last_analysis_stats: data.data?.attributes?.last_analysis_stats || {},
          reputation: data.data?.attributes?.reputation || 0,
          last_analysis_date: data.data?.attributes?.last_analysis_date || null,
          country: data.data?.attributes?.country || null,
          as_owner: data.data?.attributes?.as_owner || null,
          asn: data.data?.attributes?.asn || null,
          malicious_count: data.data?.attributes?.last_analysis_stats?.malicious || 0,
          suspicious_count: data.data?.attributes?.last_analysis_stats?.suspicious || 0,
          harmless_count: data.data?.attributes?.last_analysis_stats?.harmless || 0
        }
      };
    } catch (error) {
      console.error('VirusTotal API error:', error.message);
      throw error;
    }
  }

  /**
   * AbuseIPDB API - Récupère les rapports d'abus pour une IP
   */
  async fetchFromAbuseIPDB(ip) {
    try {
      const apiKey = process.env.ABUSEIPDB_API_KEY || config.ABUSEIPDB_API_KEY;
      if (!apiKey) {
        throw new Error('AbuseIPDB API key not configured');
      }

      const endpoint = 'https://api.abuseipdb.com/api/v2/check';
      const data = await this.makeRequest(endpoint, {
        method: 'GET',
        params: {
          ipAddress: ip,
          maxAgeInDays: 90,
          verbose: ''
        },
        headers: {
          'Key': apiKey,
          'Accept': 'application/json'
        }
      });

      return {
        source: 'AbuseIPDB',
        ip,
        data: {
          abuse_confidence_score: data.data?.abuseConfidenceScore || 0,
          total_reports: data.data?.totalReports || 0,
          num_distinct_users: data.data?.numDistinctUsers || 0,
          last_reported: data.data?.lastReportedAt || null,
          country_code: data.data?.countryCode || null,
          usage_type: data.data?.usageType || null,
          isp: data.data?.isp || null,
          domain: data.data?.domain || null,
          hostnames: data.data?.hostnames || [],
          is_public: data.data?.isPublic || false,
          is_whitelisted: data.data?.isWhitelisted || false,
          is_tor: data.data?.isTor || false,
          categories: data.data?.reports?.map(r => r.category) || []
        }
      };
    } catch (error) {
      console.error('AbuseIPDB API error:', error.message);
      throw error;
    }
  }

  /**
   * Shodan API - Récupère les informations sur une IP
   */
  async fetchFromShodan(ip) {
    try {
      const apiKey = process.env.SHODAN_API_KEY || config.SHODAN_API_KEY;
      if (!apiKey) {
        throw new Error('Shodan API key not configured');
      }

      const endpoint = `https://api.shodan.io/shodan/host/${ip}`;
      const data = await this.makeRequest(endpoint, {
        method: 'GET',
        params: {
          key: apiKey
        }
      });

      return {
        source: 'Shodan',
        ip,
        data: {
          country: data.country_name || null,
          city: data.city || null,
          organization: data.org || null,
          isp: data.isp || null,
          asn: data.asn || null,
          hostnames: data.hostnames || [],
          ports: data.ports || [],
          services: data.data?.map(service => ({
            port: service.port,
            service: service.product || service._shodan?.module || 'unknown',
            version: service.version || null,
            banner: service.data || null
          })) || [],
          vulns: data.vulns ? Object.keys(data.vulns) : [],
          last_update: data.last_update || null
        }
      };
    } catch (error) {
      console.error('Shodan API error:', error.message);
      throw error;
    }
  }

  /**
   * OTX (AlienVault Open Threat Exchange) API - Récupère les pulses et indicateurs
   */
  async fetchFromOTX(indicator, indicatorType = 'IPv4') {
    try {
      const apiKey = process.env.OTX_API_KEY || config.OTX_API_KEY;
      if (!apiKey) {
        throw new Error('OTX API key not configured');
      }

      let endpoint;
      switch (indicatorType.toLowerCase()) {
        case 'ipv4':
        case 'ip':
          endpoint = `https://otx.alienvault.com/api/v1/indicators/IPv4/${indicator}/general`;
          break;
        case 'domain':
          endpoint = `https://otx.alienvault.com/api/v1/indicators/domain/${indicator}/general`;
          break;
        case 'url':
          endpoint = `https://otx.alienvault.com/api/v1/indicators/url/${encodeURIComponent(indicator)}/general`;
          break;
        case 'hash':
          endpoint = `https://otx.alienvault.com/api/v1/indicators/file/${indicator}/general`;
          break;
        default:
          throw new Error(`Unsupported indicator type: ${indicatorType}`);
      }

      const data = await this.makeRequest(endpoint, {
        method: 'GET',
        headers: {
          'X-OTX-API-KEY': apiKey
        }
      });

      return {
        source: 'OTX',
        indicator,
        indicatorType,
        data: {
          pulse_count: data.pulse_info?.count || 0,
          pulses: data.pulse_info?.pulses?.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            author: p.author?.username,
            created: p.created,
            modified: p.modified,
            tags: p.tags || []
          })) || [],
          reputation: data.reputation || 0,
          validation: data.validation || [],
          sections: data.sections || []
        }
      };
    } catch (error) {
      console.error('OTX API error:', error.message);
      throw error;
    }
  }

  /**
   * Récupère les incidents récents depuis une API de Threat Intelligence
   * Format générique pour supporter différentes APIs
   */
  async fetchThreatIntelligenceFeeds(sourceConfig) {
    try {
      const { name, api_endpoint, api_key, authentication_method, configuration } = sourceConfig;

      if (!api_endpoint || !api_key) {
        throw new Error(`Missing API configuration for source: ${name}`);
      }

      const headers = this.buildHeaders(authentication_method, api_key, configuration?.headers);
      const params = configuration?.default_params || {};
      const requestBody = configuration?.request_body || null;

      // Déterminer la méthode HTTP (POST si request_body est fourni, sinon GET)
      const method = requestBody ? 'POST' : 'GET';

      const requestOptions = {
        method,
        headers,
      };

      // Ajouter params pour GET, body pour POST
      if (method === 'GET') {
        requestOptions.params = params;
      } else {
        requestOptions.data = requestBody || params;
      }

      const data = await this.makeRequest(api_endpoint, requestOptions);

      return {
        source: name,
        data,
        timestamp: new Date()
      };
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          error.message || 
                          'Unknown error';
      const statusCode = error.response?.status || 'N/A';
      
      console.error(`Error fetching from ${sourceConfig.name}:`, {
        message: errorMessage,
        status: statusCode,
        endpoint: sourceConfig.api_endpoint
      });
      
      throw new Error(`Failed to fetch from ${sourceConfig.name}: ${errorMessage} (Status: ${statusCode})`);
    }
  }

  /**
   * Construit les headers d'authentification selon la méthode
   */
  buildHeaders(authMethod, apiKey, customHeaders = {}) {
    const headers = { ...customHeaders };

    switch (authMethod) {
      case 'API_KEY':
        headers['X-API-Key'] = apiKey;
        break;
      case 'Bearer':
        headers['Authorization'] = `Bearer ${apiKey}`;
        break;
      case 'Basic':
        headers['Authorization'] = `Basic ${Buffer.from(apiKey).toString('base64')}`;
        break;
      case 'OAuth':
        // OAuth nécessite un token séparé, à gérer selon l'implémentation
        headers['Authorization'] = `Bearer ${apiKey}`;
        break;
      default:
        headers['X-API-Key'] = apiKey;
    }

    return headers;
  }

  /**
   * Enrichit une IP avec toutes les sources disponibles
   */
  async enrichIPData(ip) {
    const enrichmentData = {
      ip,
      sources: {},
      timestamp: new Date()
    };

    // VirusTotal
    try {
      enrichmentData.sources.virustotal = await this.fetchFromVirusTotal(ip, 'ip');
    } catch (error) {
      console.warn(`VirusTotal enrichment failed for ${ip}:`, error.message);
    }

    // AbuseIPDB
    try {
      enrichmentData.sources.abuseipdb = await this.fetchFromAbuseIPDB(ip);
    } catch (error) {
      console.warn(`AbuseIPDB enrichment failed for ${ip}:`, error.message);
    }

    // Shodan
    try {
      enrichmentData.sources.shodan = await this.fetchFromShodan(ip);
    } catch (error) {
      console.warn(`Shodan enrichment failed for ${ip}:`, error.message);
    }

    // OTX
    try {
      enrichmentData.sources.otx = await this.fetchFromOTX(ip, 'IPv4');
    } catch (error) {
      console.warn(`OTX enrichment failed for ${ip}:`, error.message);
    }

    return enrichmentData;
  }
}

module.exports = new ExternalAPIService();
