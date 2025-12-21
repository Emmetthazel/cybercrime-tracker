const Attack = require('../models/Attack');
const IP = require('../models/IP');
const neo4jService = require('./neo4jService');

/**
 * Advanced Search Service
 * Provides unified search across attacks, IPs, and graph relationships
 */

/**
 * Search attacks with advanced filters
 * @param {Object} filters - Search filters
 * @returns {Promise} Search results
 */
const searchAttacks = async (filters = {}) => {
  try {
    const {
      q, // search query (full-text)
      type,
      severity,
      status,
      target_country,
      source_country,
      target_sector,
      source_ip,
      start_date,
      end_date,
      assigned_to,
      reported_by,
      threat_actor,
      campaign_id,
      page = 1,
      limit = 20,
      sortBy = 'date',
      sortOrder = 'desc'
    } = filters;

  const query = {};

  // Text search across multiple fields (if text index exists, otherwise use regex)
  if (q && q.trim()) {
    // Escape special regex characters
    const escapedQuery = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { description: { $regex: escapedQuery, $options: 'i' } },
      { type: { $regex: escapedQuery, $options: 'i' } },
      { source_ip: { $regex: escapedQuery, $options: 'i' } },
      { target_country: { $regex: escapedQuery, $options: 'i' } },
      { target_org: { $regex: escapedQuery, $options: 'i' } },
      { attack_pattern: { $regex: escapedQuery, $options: 'i' } },
      { threat_actor: { $regex: escapedQuery, $options: 'i' } },
      { campaign_id: { $regex: escapedQuery, $options: 'i' } },
      { tags: { $regex: escapedQuery, $options: 'i' } }
    ];
  }

  // Filter by type (handle both array and single value)
  if (type !== undefined && type !== null && type !== '') {
    if (Array.isArray(type)) {
      query.type = { $in: type.filter(t => t && t !== '') };
    } else {
      query.type = type;
    }
  }

  // Filter by severity (handle both array and single value)
  if (severity !== undefined && severity !== null && severity !== '') {
    if (Array.isArray(severity)) {
      query.severity = { $in: severity.filter(s => s && s !== '') };
    } else {
      query.severity = severity;
    }
  }

  // Filter by status (handle both array and single value)
  if (status !== undefined && status !== null && status !== '') {
    if (Array.isArray(status)) {
      query.status = { $in: status.filter(s => s && s !== '') };
    } else {
      query.status = status;
    }
  }

  // Filter by target country
  if (target_country) {
    if (Array.isArray(target_country)) {
      query.target_country = { $in: target_country };
    } else {
      query.target_country = target_country;
    }
  }

  // Filter by source country
  if (source_country) {
    query.source_country = source_country;
  }

  // Filter by target sector
  if (target_sector) {
    if (Array.isArray(target_sector)) {
      query.target_sector = { $in: target_sector };
    } else {
      query.target_sector = target_sector;
    }
  }

  // Filter by source IP
  if (source_ip) {
    query.source_ip = { $regex: source_ip, $options: 'i' };
  }

  // Date range filter
  if (start_date || end_date) {
    query.date = {};
    if (start_date) {
      query.date.$gte = new Date(start_date);
    }
    if (end_date) {
      query.date.$lte = new Date(end_date);
    }
  }

  // Filter by assigned user
  if (assigned_to) {
    query.assigned_to = assigned_to;
  }

  // Filter by reported by
  if (reported_by) {
    query.reported_by = reported_by;
  }

  // Filter by threat actor
  if (threat_actor) {
    query.threat_actor = { $regex: threat_actor, $options: 'i' };
  }

  // Filter by campaign ID
  if (campaign_id) {
    query.campaign_id = campaign_id;
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Execute query
  const skip = (page - 1) * limit;
  
  const [attacks, total] = await Promise.all([
    Attack.find(query)
      .populate('reported_by', 'username full_name')
      .populate('assigned_to', 'username full_name')
      .populate('source_ip_ref', 'ip_address country threat_score')
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .lean(),
    Attack.countDocuments(query)
  ]);

    return {
      attacks,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Error in searchAttacks:', error);
    throw error;
  }
};

/**
 * Search IPs with advanced filters
 * @param {Object} filters - Search filters
 * @returns {Promise} Search results
 */
const searchIPs = async (filters = {}) => {
  try {
    const {
      q,
      country,
      is_blacklisted,
      min_threat_score,
      max_threat_score,
      asn,
      isp,
      page = 1,
      limit = 20,
      sortBy = 'threat_score',
      sortOrder = 'desc'
    } = filters;

  const query = {};

  // Text search
  if (q && q.trim()) {
    // Escape special regex characters
    const escapedQuery = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { ip_address: { $regex: escapedQuery, $options: 'i' } },
      { country: { $regex: escapedQuery, $options: 'i' } },
      { isp: { $regex: escapedQuery, $options: 'i' } },
      { organization: { $regex: escapedQuery, $options: 'i' } },
      { asn: { $regex: escapedQuery, $options: 'i' } }
    ];
  }

  // Filter by country
  if (country) {
    if (Array.isArray(country)) {
      query.country = { $in: country };
    } else {
      query.country = country;
    }
  }

  // Filter by blacklist status
  if (is_blacklisted !== undefined) {
    query.is_blacklisted = is_blacklisted === 'true' || is_blacklisted === true;
  }

  // Filter by threat score range
  if (min_threat_score || max_threat_score) {
    query.threat_score = {};
    if (min_threat_score) {
      query.threat_score.$gte = parseInt(min_threat_score);
    }
    if (max_threat_score) {
      query.threat_score.$lte = parseInt(max_threat_score);
    }
  }

  // Filter by ASN
  if (asn) {
    query.asn = { $regex: asn, $options: 'i' };
  }

  // Filter by ISP
  if (isp) {
    query.isp = { $regex: isp, $options: 'i' };
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Execute query
  const skip = (page - 1) * limit;
  
  const [ips, total] = await Promise.all([
    IP.find(query)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .lean(),
    IP.countDocuments(query)
  ]);

    return {
      ips,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Error in searchIPs:', error);
    throw error;
  }
};

/**
 * Graph-based search: Find attacks related to a specific IP
 * @param {string} ipAddress - IP address to search
 * @param {Object} options - Search options
 * @returns {Promise} Related attacks
 */
const searchAttacksByIP = async (ipAddress, options = {}) => {
  const { maxDepth = 2, page = 1, limit = 20 } = options;

  try {
    // First, find the IP in MongoDB
    const ip = await IP.findOne({ ip_address: ipAddress });
    if (!ip) {
      return { attacks: [], total: 0, page, limit, totalPages: 0 };
    }

    // Find related attacks in Neo4j
    const attackChain = await neo4jService.findAttackChain(ip._id.toString());
    
    // Get attack IDs from the attack chain
    const attackIds = attackChain
      .map(chain => {
        // Handle both formats: { attack: { id: ... } } or { attack: { properties: { id: ... } } }
        const attack = chain.attack;
        if (!attack) return null;
        return attack.id || (attack.properties && attack.properties.id) || null;
      })
      .filter(Boolean);
    
    if (attackIds.length === 0) {
      return { attacks: [], total: 0, page, limit, totalPages: 0 };
    }

    // Fetch full attack details from MongoDB
    const skip = (page - 1) * limit;
    const [attacks, total] = await Promise.all([
      Attack.find({ _id: { $in: attackIds } })
        .populate('reported_by', 'username full_name')
        .populate('source_ip_ref', 'ip_address country threat_score')
        .sort({ date: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      Attack.countDocuments({ _id: { $in: attackIds } })
    ]);

    return {
      attacks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      relatedIP: ip
    };
  } catch (error) {
    console.error('Error in graph-based IP search:', error);
    throw error;
  }
};

/**
 * Unified search across attacks and IPs
 * @param {Object} filters - Search filters
 * @returns {Promise} Combined search results
 */
const unifiedSearch = async (filters = {}) => {
  try {
    const { q, resourceType = 'all', ...otherFilters } = filters;

    const results = {
      attacks: [],
      ips: [],
      total: 0
    };

    // Search attacks if requested
    if (resourceType === 'all' || resourceType === 'attacks') {
      try {
        const attackResults = await searchAttacks({ q, ...otherFilters });
        results.attacks = attackResults.attacks || [];
        results.total += attackResults.total || 0;
      } catch (error) {
        console.error('Error searching attacks:', error);
        // Continue with IP search even if attack search fails
        results.attacks = [];
      }
    }

    // Search IPs if requested
    if (resourceType === 'all' || resourceType === 'ips') {
      try {
        const ipResults = await searchIPs({ q, ...otherFilters });
        results.ips = ipResults.ips || [];
        results.total += ipResults.total || 0;
      } catch (error) {
        console.error('Error searching IPs:', error);
        // Continue even if IP search fails
        results.ips = [];
      }
    }

    return results;
  } catch (error) {
    console.error('Error in unified search:', error);
    throw error;
  }
};

module.exports = {
  searchAttacks,
  searchIPs,
  searchAttacksByIP,
  unifiedSearch
};

