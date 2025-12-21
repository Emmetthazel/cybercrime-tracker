const searchService = require('../services/searchService');
const AuditLog = require('../models/AuditLog');

/**
 * Search Controller
 * Handles all search-related endpoints
 */

/**
 * Search attacks with advanced filters
 * GET /api/search/attacks
 */
exports.searchAttacks = async (req, res) => {
  try {
    const filters = req.query;
    const results = await searchService.searchAttacks(filters);

    // Log audit
    if (req.user) {
      await AuditLog.create({
        action: 'SEARCH',
        resource_type: 'Attack',
        user_id: req.user._id,
        username: req.user.username,
        ip_address: req.ip,
        description: `Searched attacks with filters: ${JSON.stringify(filters)}`
      });
    }

    res.json({
      success: true,
      ...results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching attacks',
      error: error.message
    });
  }
};

/**
 * Search IPs with advanced filters
 * GET /api/search/ips
 */
exports.searchIPs = async (req, res) => {
  try {
    const filters = req.query;
    const results = await searchService.searchIPs(filters);

    // Log audit
    if (req.user) {
      await AuditLog.create({
        action: 'SEARCH',
        resource_type: 'IP',
        user_id: req.user._id,
        username: req.user.username,
        ip_address: req.ip,
        description: `Searched IPs with filters: ${JSON.stringify(filters)}`
      });
    }

    res.json({
      success: true,
      ...results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching IPs',
      error: error.message
    });
  }
};

/**
 * Graph-based search: Find attacks related to an IP
 * GET /api/search/ip/:ipAddress/attacks
 */
exports.searchAttacksByIP = async (req, res) => {
  try {
    const { ipAddress } = req.params;
    const options = {
      maxDepth: parseInt(req.query.maxDepth) || 2,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };

    const results = await searchService.searchAttacksByIP(ipAddress, options);

    // Log audit
    if (req.user) {
      await AuditLog.create({
        action: 'SEARCH',
        resource_type: 'Attack',
        user_id: req.user._id,
        username: req.user.username,
        ip_address: req.ip,
        description: `Searched attacks for IP: ${ipAddress}`
      });
    }

    res.json({
      success: true,
      ...results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching attacks by IP',
      error: error.message
    });
  }
};

/**
 * Unified search across all resources
 * GET /api/search
 */
exports.unifiedSearch = async (req, res) => {
  try {
    const filters = req.query;
    
    // Clean up filters - remove empty strings
    const cleanFilters = {};
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '') {
        cleanFilters[key] = value;
      }
    });

    const results = await searchService.unifiedSearch(cleanFilters);

    // Log audit
    if (req.user) {
      try {
        await AuditLog.create({
          action: 'SEARCH',
          resource_type: 'All',
          user_id: req.user._id,
          username: req.user.username,
          ip_address: req.ip,
          description: `Unified search: ${cleanFilters.q || 'all'}`
        });
      } catch (auditError) {
        // Don't fail the request if audit logging fails
        console.error('Error logging audit:', auditError);
      }
    }

    res.json({
      success: true,
      ...results
    });
  } catch (error) {
    console.error('Unified search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing unified search',
      error: error.message
    });
  }
};

/**
 * Get available filter options (for dropdowns, etc.)
 * GET /api/search/filters
 */
exports.getFilterOptions = async (req, res) => {
  try {
    const Attack = require('../models/Attack');
    const IP = require('../models/IP');

    // Get unique values for filters
    const [attackTypes, severities, statuses, targetCountries, sourceCountries, sectors, ipCountries] = await Promise.all([
      Attack.distinct('type'),
      Attack.distinct('severity'),
      Attack.distinct('status'),
      Attack.distinct('target_country'),
      Attack.distinct('source_country'),
      Attack.distinct('target_sector'),
      IP.distinct('country')
    ]);

    res.json({
      success: true,
      filters: {
        attackTypes: attackTypes.sort(),
        severities: severities.sort(),
        statuses: statuses.sort(),
        targetCountries: targetCountries.filter(Boolean).sort(),
        sourceCountries: sourceCountries.filter(Boolean).sort(),
        sectors: sectors.filter(Boolean).sort(),
        ipCountries: ipCountries.filter(Boolean).sort()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching filter options',
      error: error.message
    });
  }
};

