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
    // Campaign detection: find attacks connected via RELATED_TO relationships
    // OR that share the same source IP
    let query = `
      MATCH (a1:Attack)
      WHERE a1.date IS NOT NULL
    `;
    
    if (startDate) {
      query += ` AND a1.date >= $startDate`;
    }
    
    query += `
      OPTIONAL MATCH (a1)-[:RELATED_TO]-(a2:Attack)
      WHERE a2.date IS NOT NULL
    `;
    
    if (startDate) {
      query += ` AND a2.date >= $startDate`;
    }
    
    query += `
      OPTIONAL MATCH (a1)-[:ORIGINATED_FROM]->(ip:IP)<-[:ORIGINATED_FROM]-(a3:Attack)
      WHERE a3.id <> a1.id AND a3.date IS NOT NULL
    `;
    
    if (startDate) {
      query += ` AND a3.date >= $startDate`;
    }
    
    query += `
      WITH a1, 
           collect(DISTINCT a2) as related,
           collect(DISTINCT a3) as same_ip
      WITH a1, related, same_ip,
           [x IN related WHERE x IS NOT NULL] + 
           [x IN same_ip WHERE x IS NOT NULL] as all_related_raw
      WITH a1, all_related_raw
      WHERE size(all_related_raw) >= $minAttacks - 1
      RETURN a1.id as campaign_lead,
             a1.campaign_id as campaign_id,
             a1.threat_actor as threat_actor,
             a1.date as a1_date,
             [a IN all_related_raw | a.date] as related_dates,
             size(all_related_raw) + 1 as attack_count,
             [a1] + all_related_raw as campaign_attacks
      ORDER BY attack_count DESC
      LIMIT 20
    `;
    
    const params = { minAttacks };
    if (startDate) {
      params.startDate = startDate.toISOString();
    }
    
    try {
      const result = await tx.run(query, params);
      
      // Deduplicate campaigns by campaign_lead
      const seen = new Set();
      
      return result.records
        .map(record => {
          const campaign_lead = record.get('campaign_lead');
          
          // Skip duplicates
          if (seen.has(campaign_lead)) {
            return null;
          }
          seen.add(campaign_lead);
          
          const campaign_attacks = record.get('campaign_attacks');
          const a1_date = record.get('a1_date');
          const related_dates = record.get('related_dates') || [];
          
          // Deduplicate attacks by ID in JavaScript
          const attackMap = new Map();
          if (campaign_attacks) {
            campaign_attacks.forEach(attack => {
              if (attack) {
                const attackId = attack.properties ? attack.properties.id : (attack.id || JSON.stringify(attack));
                if (!attackMap.has(attackId)) {
                  attackMap.set(attackId, attack.properties || attack);
                }
              }
            });
          }
          const uniqueAttacks = Array.from(attackMap.values());
          
          // Extract all dates (filter out null/empty)
          const allDates = [];
          if (a1_date) allDates.push(a1_date);
          related_dates.forEach(date => {
            if (date) allDates.push(date);
          });
          
          // Calculate min/max dates
          let start_date = null;
          let end_date = null;
          if (allDates.length > 0) {
            allDates.sort(); // ISO strings sort correctly
            start_date = allDates[0];
            end_date = allDates[allDates.length - 1];
          }
          
          return {
            campaign_lead: campaign_lead,
            campaign_id: record.get('campaign_id'),
            threat_actor: record.get('threat_actor'),
            start_date: start_date,
            end_date: end_date,
            attack_count: uniqueAttacks.length,
            attacks: uniqueAttacks,
          };
        })
        .filter(campaign => campaign !== null);
    } catch (error) {
      console.error('Campaign detection query error:', error.message);
      console.error('Query:', query);
      console.error('Params:', params);
      throw error;
    }
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

/**
 * Get graph data for visualization
 * @param {number} maxNodes - Maximum number of nodes to return
 * @returns {Promise} Graph data in format: { nodes: [], links: [] }
 */
const getGraphVisualization = async (maxNodes = 100) => {
  return await readTransaction(async (tx) => {
    // Get nodes
    const nodesQuery = `
      MATCH (n)
      WHERE labels(n)[0] IN ['Attack', 'IP', 'User']
      RETURN n, labels(n)[0] as label
      LIMIT ${maxNodes}
    `;
    
    // Get relationships
    const relsQuery = `
      MATCH (a)-[r]->(b)
      WHERE labels(a)[0] IN ['Attack', 'IP', 'User']
        AND labels(b)[0] IN ['Attack', 'IP', 'User']
      RETURN a.id as source, b.id as target, type(r) as type, r
      LIMIT 200
    `;
    
    const [nodesResult, relsResult] = await Promise.all([
      tx.run(nodesQuery),
      tx.run(relsQuery)
    ]);
    
    // Build node map
    const nodeMap = new Map();
    nodesResult.records.forEach(record => {
      const node = record.get('n');
      const label = record.get('label');
      const nodeId = node.properties.id;
      
      nodeMap.set(nodeId, {
        id: nodeId,
        label: label,
        ...node.properties
      });
    });
    
    // Build links (only include if both nodes exist)
    const links = [];
    const linkSet = new Set(); // To avoid duplicates
    
    relsResult.records.forEach(record => {
      const source = record.get('source');
      const target = record.get('target');
      const type = record.get('type');
      const rel = record.get('r');
      
      // Only add link if both nodes are in our node map
      if (nodeMap.has(source) && nodeMap.has(target)) {
        const linkKey = `${source}-${type}-${target}`;
        if (!linkSet.has(linkKey)) {
          linkSet.add(linkKey);
          links.push({
            source: source,
            target: target,
            type: type,
            ...(rel.properties || {})
          });
        }
      }
    });
    
    return {
      nodes: Array.from(nodeMap.values()),
      links: links
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
  getGraphVisualization,
};

