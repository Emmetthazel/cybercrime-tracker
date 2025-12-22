const neo4jService = require('./neo4jService');

/**
 * Graph Sync Service
 * Synchronizes MongoDB documents with Neo4j graph relationships
 */

/**
 * Sync an Attack document to Neo4j
 * @param {Object} attack - Attack document from MongoDB
 */
const syncAttack = async (attack) => {
  try {
    // Create/update Attack node
    await neo4jService.createOrUpdateNode('Attack', {
      id: attack._id.toString(),
      type: attack.type,
      severity: attack.severity,
      severity_score: attack.severity_score,
      status: attack.status,
      date: attack.date?.toISOString(),
      campaign_id: attack.campaign_id,
      threat_actor: attack.threat_actor,
      attack_pattern: attack.attack_pattern,
      source_country: attack.source_country,
      target_country: attack.target_country,
      target_sector: attack.target_sector,
    });

    // Sync relationships
    if (attack.source_ip_ref) {
      // Handle both populated object and ObjectId
      const ipId = attack.source_ip_ref._id ? attack.source_ip_ref._id.toString() : attack.source_ip_ref.toString();
      try {
        await neo4jService.createRelationship(
          'Attack',
          attack._id.toString(),
          'ORIGINATED_FROM',
          'IP',
          ipId,
          { source_ip: attack.source_ip }
        );
      } catch (relError) {
        console.error(`Error creating ORIGINATED_FROM relationship for attack ${attack._id} to IP ${ipId}:`, relError.message);
      }
    }

    if (attack.reported_by) {
      // Handle both populated object and ObjectId
      const userId = attack.reported_by._id ? attack.reported_by._id.toString() : attack.reported_by.toString();
      try {
        await neo4jService.createRelationship(
          'Attack',
          attack._id.toString(),
          'REPORTED_BY',
          'User',
          userId
        );
      } catch (relError) {
        console.error(`Error creating REPORTED_BY relationship for attack ${attack._id} to User ${userId}:`, relError.message);
      }
    }

    if (attack.assigned_to) {
      // Handle both populated object and ObjectId
      const assignedToId = attack.assigned_to._id ? attack.assigned_to._id.toString() : attack.assigned_to.toString();
      await neo4jService.createRelationship(
        'Attack',
        attack._id.toString(),
        'ASSIGNED_TO',
        'User',
        assignedToId
      );
    }

    if (attack.verified_by) {
      // Handle both populated object and ObjectId
      const verifiedById = attack.verified_by._id ? attack.verified_by._id.toString() : attack.verified_by.toString();
      await neo4jService.createRelationship(
        'Attack',
        attack._id.toString(),
        'VERIFIED_BY',
        'User',
        verifiedById
      );
    }

    // Sync related attacks
    if (attack.related_attacks && attack.related_attacks.length > 0) {
      for (const relatedId of attack.related_attacks) {
        await neo4jService.createRelationship(
          'Attack',
          attack._id.toString(),
          'RELATED_TO',
          'Attack',
          relatedId.toString(),
          { relation_type: 'same_campaign', confidence: 0.8 }
        );
      }
    }

    // Sync vulnerabilities
    if (attack.related_vulnerabilities && attack.related_vulnerabilities.length > 0) {
      for (const vulnId of attack.related_vulnerabilities) {
        await neo4jService.createRelationship(
          'Attack',
          attack._id.toString(),
          'EXPLOITS',
          'Vulnerability',
          vulnId.toString(),
          { exploited_at: attack.date?.toISOString() }
        );
      }
    }

    // Sync threat intelligence indicators
    if (attack.related_indicators && attack.related_indicators.length > 0) {
      for (const indicatorId of attack.related_indicators) {
        await neo4jService.createRelationship(
          'Attack',
          attack._id.toString(),
          'USES',
          'ThreatIntelligence',
          indicatorId.toString(),
          { detected_at: attack.date?.toISOString() }
        );
      }
    }

    return true;
  } catch (error) {
    console.error(`Error syncing attack ${attack._id}:`, error.message);
    return false;
  }
};

/**
 * Sync an IP document to Neo4j
 * @param {Object} ip - IP document from MongoDB
 */
const syncIP = async (ip) => {
  try {
    // Create/update IP node
    await neo4jService.createOrUpdateNode('IP', {
      id: ip._id.toString(),
      ip_address: ip.ip_address,
      country: ip.country,
      country_code: ip.country_code,
      asn: ip.asn,
      asn_name: ip.asn_name,
      isp: ip.isp,
      organization: ip.organization,
      threat_score: ip.threat_score,
      risk_level: ip.risk_level,
      is_blacklisted: ip.is_blacklisted,
      first_seen: ip.first_seen?.toISOString(),
      last_activity: ip.last_activity?.toISOString(),
    });

    // Sync IP associations (same ASN, same organization)
    // Note: This would require finding other IPs with same ASN in MongoDB first
    // For now, we'll handle this separately when needed

    return true;
  } catch (error) {
    console.error(`Error syncing IP ${ip._id}:`, error.message);
    return false;
  }
};

/**
 * Sync IP associations (IPs with same ASN or organization)
 * @param {Object} ip1 - First IP document
 * @param {Object} ip2 - Second IP document
 * @param {string} associationType - Type of association ('same_asn', 'same_organization', etc.)
 */
const syncIPAssociation = async (ip1, ip2, associationType = 'same_asn') => {
  try {
    const properties = {
      association_type: associationType,
    };

    if (associationType === 'same_asn' && ip1.asn) {
      properties.asn = ip1.asn;
    } else if (associationType === 'same_organization' && ip1.organization) {
      properties.organization = ip1.organization;
    }

    await neo4jService.createRelationship(
      'IP',
      ip1._id.toString(),
      'ASSOCIATED_WITH',
      'IP',
      ip2._id.toString(),
      properties
    );

    return true;
  } catch (error) {
    console.error(`Error syncing IP association:`, error.message);
    return false;
  }
};

/**
 * Sync a User document to Neo4j
 * @param {Object} user - User document from MongoDB
 */
const syncUser = async (user) => {
  try {
    await neo4jService.createOrUpdateNode('User', {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      organization: user.organization,
      is_active: user.is_active,
    });

    return true;
  } catch (error) {
    console.error(`Error syncing user ${user._id}:`, error.message);
    return false;
  }
};

/**
 * Remove an Attack node and its relationships from Neo4j
 * @param {string} attackId - Attack ID
 */
const removeAttack = async (attackId) => {
  try {
    await neo4jService.deleteNode('Attack', attackId.toString());
    return true;
  } catch (error) {
    console.error(`Error removing attack ${attackId}:`, error.message);
    return false;
  }
};

/**
 * Remove an IP node and its relationships from Neo4j
 * @param {string} ipId - IP ID
 */
const removeIP = async (ipId) => {
  try {
    await neo4jService.deleteNode('IP', ipId.toString());
    return true;
  } catch (error) {
    console.error(`Error removing IP ${ipId}:`, error.message);
    return false;
  }
};

module.exports = {
  syncAttack,
  syncIP,
  syncIPAssociation,
  syncUser,
  removeAttack,
  removeIP,
};

