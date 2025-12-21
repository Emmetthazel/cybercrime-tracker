const { readTransaction, writeTransaction } = require('../../Configuration/config/neo4j');

/**
 * Neo4j Service Layer
 * Handles all Neo4j graph database operations for relationships
 */

/**
 * Create or update a node in Neo4j
 * @param {string} label - Node label (e.g., 'Attack', 'IP', 'User')
 * @param {Object} properties - Node properties
 * @returns {Promise} Created/updated node
 */
const createOrUpdateNode = async (label, properties) => {
  return await writeTransaction(async (tx) => {
    const query = `
      MERGE (n:${label} {id: $id})
      SET n += $properties
      RETURN n
    `;
    const result = await tx.run(query, {
      id: properties.id,
      properties: properties,
    });
    return result.records[0]?.get('n');
  });
};

/**
 * Create a relationship between two nodes
 * @param {string} fromLabel - Source node label
 * @param {string} fromId - Source node ID
 * @param {string} relationshipType - Relationship type (e.g., 'ORIGINATED_FROM', 'RELATED_TO')
 * @param {string} toLabel - Target node label
 * @param {string} toId - Target node ID
 * @param {Object} properties - Relationship properties (optional)
 * @returns {Promise} Created relationship
 */
const createRelationship = async (
  fromLabel,
  fromId,
  relationshipType,
  toLabel,
  toId,
  properties = {}
) => {
  return await writeTransaction(async (tx) => {
    const query = `
      MATCH (from:${fromLabel} {id: $fromId})
      MATCH (to:${toLabel} {id: $toId})
      MERGE (from)-[r:${relationshipType}]->(to)
      SET r += $properties
      RETURN r
    `;
    const result = await tx.run(query, {
      fromId,
      toId,
      properties,
    });
    return result.records[0]?.get('r');
  });
};

/**
 * Delete a relationship between two nodes
 * @param {string} fromLabel - Source node label
 * @param {string} fromId - Source node ID
 * @param {string} relationshipType - Relationship type
 * @param {string} toLabel - Target node label
 * @param {string} toId - Target node ID
 */
const deleteRelationship = async (
  fromLabel,
  fromId,
  relationshipType,
  toLabel,
  toId
) => {
  return await writeTransaction(async (tx) => {
    const query = `
      MATCH (from:${fromLabel} {id: $fromId})-[r:${relationshipType}]->(to:${toLabel} {id: $toId})
      DELETE r
      RETURN count(r) as deleted
    `;
    const result = await tx.run(query, { fromId, toId });
    return result.records[0]?.get('deleted').toNumber();
  });
};

/**
 * Delete a node and all its relationships
 * @param {string} label - Node label
 * @param {string} id - Node ID
 */
const deleteNode = async (label, id) => {
  return await writeTransaction(async (tx) => {
    const query = `
      MATCH (n:${label} {id: $id})
      DETACH DELETE n
      RETURN count(n) as deleted
    `;
    const result = await tx.run(query, { id });
    return result.records[0]?.get('deleted').toNumber();
  });
};

/**
 * Find related attacks for campaign detection
 * @param {string} attackId - Attack ID
 * @param {number} maxDepth - Maximum relationship depth (default: 3)
 * @returns {Promise} Array of related attacks
 */
const findRelatedAttacks = async (attackId, maxDepth = 3) => {
  return await readTransaction(async (tx) => {
    const query = `
      MATCH path = (a1:Attack {id: $attackId})-[r:RELATED_TO*1..${maxDepth}]-(a2:Attack)
      RETURN DISTINCT a2, length(path) as depth
      ORDER BY depth, a2.date DESC
      LIMIT 50
    `;
    const result = await tx.run(query, { attackId });
    return result.records.map(record => ({
      attack: record.get('a2').properties,
      depth: record.get('depth').toNumber(),
    }));
  });
};

/**
 * Find all IPs associated with an IP (same ASN, organization, etc.)
 * @param {string} ipId - IP node ID
 * @param {number} maxDepth - Maximum relationship depth
 * @returns {Promise} Array of associated IPs
 */
const findAssociatedIPs = async (ipId, maxDepth = 2) => {
  return await readTransaction(async (tx) => {
    const query = `
      MATCH path = (ip1:IP {id: $ipId})-[r:ASSOCIATED_WITH*1..${maxDepth}]-(ip2:IP)
      RETURN DISTINCT ip2, length(path) as depth
      ORDER BY depth, ip2.threat_score DESC
      LIMIT 100
    `;
    const result = await tx.run(query, { ipId });
    return result.records.map(record => ({
      ip: record.get('ip2').properties,
      depth: record.get('depth').toNumber(),
    }));
  });
};

/**
 * Find attack chain from an IP
 * @param {string} ipId - IP node ID
 * @returns {Promise} Attack chain with all related data
 */
const findAttackChain = async (ipId) => {
  return await readTransaction(async (tx) => {
    const query = `
      MATCH path = (ip:IP {id: $ipId})<-[:ORIGINATED_FROM]-(a:Attack)
      OPTIONAL MATCH (a)-[:EXPLOITS]->(v:Vulnerability)
      OPTIONAL MATCH (a)-[:USES]->(ti:ThreatIntelligence)
      OPTIONAL MATCH (a)-[:RELATED_TO]-(related:Attack)
      RETURN a, collect(DISTINCT v) as vulnerabilities, 
             collect(DISTINCT ti) as indicators,
             collect(DISTINCT related) as related_attacks
      ORDER BY a.date DESC
      LIMIT 100
    `;
    const result = await tx.run(query, { ipId });
    return result.records.map(record => ({
      attack: record.get('a').properties,
      vulnerabilities: record.get('vulnerabilities').map(v => v.properties),
      indicators: record.get('indicators').map(ti => ti.properties),
      related_attacks: record.get('related_attacks').map(a => a.properties),
    }));
  });
};

/**
 * Detect campaigns by finding clusters of related attacks
 * @param {number} minAttacks - Minimum number of attacks in a campaign
 * @param {Date} startDate - Start date for campaign detection
 * @returns {Promise} Array of detected campaigns
 */
const detectCampaigns = async (minAttacks = 3, startDate = null) => {
  return await readTransaction(async (tx) => {
    let query = `
      MATCH (a1:Attack)-[:RELATED_TO]-(a2:Attack)
      WHERE a1.id <> a2.id
    `;
    
    if (startDate) {
      query += ` AND a1.date >= datetime($startDate) AND a2.date >= datetime($startDate)`;
    }
    
    query += `
      WITH a1, collect(DISTINCT a2) as related
      WHERE size(related) >= $minAttacks
      RETURN a1.id as campaign_lead, 
             collect(DISTINCT a1) + collect(DISTINCT related) as campaign_attacks,
             a1.campaign_id as campaign_id,
             a1.threat_actor as threat_actor,
             min([a in collect(DISTINCT a1) + collect(DISTINCT related) | a.date]) as start_date,
             max([a in collect(DISTINCT a1) + collect(DISTINCT related) | a.date]) as end_date,
             count(DISTINCT related) + 1 as attack_count
      ORDER BY attack_count DESC
      LIMIT 20
    `;
    
    const params = { minAttacks };
    if (startDate) {
      params.startDate = startDate.toISOString();
    }
    
    const result = await tx.run(query, params);
    return result.records.map(record => ({
      campaign_lead: record.get('campaign_lead'),
      campaign_id: record.get('campaign_id'),
      threat_actor: record.get('threat_actor'),
      start_date: record.get('start_date'),
      end_date: record.get('end_date'),
      attack_count: record.get('attack_count').toNumber(),
      attacks: record.get('campaign_attacks').map(a => a.properties),
    }));
  });
};

/**
 * Find threat intelligence network (related indicators)
 * @param {string} indicatorId - Threat intelligence indicator ID
 * @param {number} maxDepth - Maximum relationship depth
 * @returns {Promise} Network of related indicators
 */
const findThreatIntelligenceNetwork = async (indicatorId, maxDepth = 3) => {
  return await readTransaction(async (tx) => {
    const query = `
      MATCH path = (ti1:ThreatIntelligence {id: $indicatorId})-[r:RELATED_TO*1..${maxDepth}]-(ti2:ThreatIntelligence)
      RETURN DISTINCT ti2, length(path) as depth
      ORDER BY depth, ti2.threat_score DESC
      LIMIT 50
    `;
    const result = await tx.run(query, { indicatorId });
    return result.records.map(record => ({
      indicator: record.get('ti2').properties,
      depth: record.get('depth').toNumber(),
    }));
  });
};

/**
 * Get graph statistics
 * @returns {Promise} Graph statistics
 */
const getGraphStatistics = async () => {
  return await readTransaction(async (tx) => {
    const queries = [
      'MATCH (n) RETURN labels(n)[0] as label, count(n) as count',
      'MATCH ()-[r]->() RETURN type(r) as type, count(r) as count',
    ];
    
    const [nodesResult, relsResult] = await Promise.all([
      tx.run(queries[0]),
      tx.run(queries[1]),
    ]);
    
    return {
      nodes: nodesResult.records.map(record => ({
        label: record.get('label'),
        count: record.get('count').toNumber(),
      })),
      relationships: relsResult.records.map(record => ({
        type: record.get('type'),
        count: record.get('count').toNumber(),
      })),
    };
  });
};

module.exports = {
  createOrUpdateNode,
  createRelationship,
  deleteRelationship,
  deleteNode,
  findRelatedAttacks,
  findAssociatedIPs,
  findAttackChain,
  detectCampaigns,
  findThreatIntelligenceNetwork,
  getGraphStatistics,
};

