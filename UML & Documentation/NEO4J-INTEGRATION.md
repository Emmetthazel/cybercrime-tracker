# Neo4j Integration Guide

## Overview

This document describes the Neo4j graph database integration for the Cybercrime Tracker project. Neo4j is used alongside MongoDB to handle complex relationship queries that would be inefficient or impossible with MongoDB alone.

## Architecture

### Hybrid Database Approach

- **MongoDB**: Stores document data (attack details, IP information, user profiles, timestamps, etc.)
- **Neo4j**: Stores relationships between entities (attack connections, IP associations, threat intelligence networks)

### Why Neo4j?

Neo4j excels at:
- **Campaign Detection**: Finding related attacks through graph traversal
- **Network Analysis**: Discovering IP associations (same ASN, organization)
- **Threat Intelligence Connections**: Connecting indicators, malware families, C2 servers
- **Path Queries**: Tracing attack chains across multiple hops
- **Real-time Relationship Queries**: Fast traversal without complex MongoDB aggregations

## Setup

### 1. Install Neo4j

**Option A: Docker (Recommended)**
```bash
docker run \
    --name neo4j-cybercrime \
    -p7474:7474 -p7687:7687 \
    -e NEO4J_AUTH=neo4j/your_password \
    -e NEO4J_PLUGINS='["apoc"]' \
    neo4j:latest
```

**Option B: Desktop Application**
Download from: https://neo4j.com/download/

### 2. Configure Environment Variables

Add to your `.env` file:
```env
# Neo4j Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
NEO4J_DATABASE=neo4j
```

### 3. Verify Connection

The application will attempt to connect to Neo4j on startup. If Neo4j is not available, the app will continue to run with MongoDB only (graph features will be disabled).

## Data Model

### Node Labels

- **Attack**: Attack incidents
- **IP**: IP addresses
- **User**: System users/analysts
- **Vulnerability**: CVE vulnerabilities
- **ThreatIntelligence**: Threat indicators (IOCs)
- **Alert**: Security alerts
- **Report**: Generated reports
- **Source**: Data sources (APIs, feeds)

### Relationship Types

- **ORIGINATED_FROM**: Attack → IP (attack originated from IP)
- **RELATED_TO**: Attack → Attack (related attacks/campaigns)
- **REPORTED_BY**: Attack → User (user who reported attack)
- **ASSIGNED_TO**: Attack → User (analyst assigned to attack)
- **VERIFIED_BY**: Attack → User (user who verified attack)
- **EXPLOITS**: Attack → Vulnerability (attack exploits vulnerability)
- **USES**: Attack → ThreatIntelligence (attack uses indicator)
- **ASSOCIATED_WITH**: IP → IP (IPs with same ASN/organization)
- **TRIGGERED_BY**: Alert → Attack/IP (alert triggered by entity)
- **INCLUDED_IN**: Attack → Report (attack included in report)

## API Endpoints

### Graph Queries

#### Get Related Attacks
```http
GET /api/graph/attacks/:id/related?maxDepth=3
```

Returns all attacks related to the specified attack within the given depth.

**Example:**
```bash
curl -X GET "http://localhost:5000/api/graph/attacks/507f1f77bcf86cd799439011/related?maxDepth=3" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get IP Attack Chain
```http
GET /api/graph/ips/:id/attack-chain
```

Returns all attacks originating from an IP with related vulnerabilities and indicators.

**Example:**
```bash
curl -X GET "http://localhost:5000/api/graph/ips/507f1f77bcf86cd799439012/attack-chain" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Associated IPs
```http
GET /api/graph/ips/:id/associated?maxDepth=2
```

Returns IPs associated with the given IP (same ASN, organization, etc.).

**Example:**
```bash
curl -X GET "http://localhost:5000/api/graph/ips/507f1f77bcf86cd799439012/associated?maxDepth=2" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Detect Campaigns
```http
GET /api/graph/campaigns/detect?minAttacks=3&days=30
```

Detects attack campaigns (clusters of related attacks).

**Example:**
```bash
curl -X GET "http://localhost:5000/api/graph/campaigns/detect?minAttacks=3&days=30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Threat Intelligence Network
```http
GET /api/graph/threat-intelligence/:id/network?maxDepth=3
```

Returns network of related threat intelligence indicators.

**Example:**
```bash
curl -X GET "http://localhost:5000/api/graph/threat-intelligence/507f1f77bcf86cd799439015/network?maxDepth=3" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Graph Statistics
```http
GET /api/graph/statistics
```

Returns statistics about nodes and relationships in the graph.

### Sync Operations

#### Sync Attack to Neo4j
```http
POST /api/graph/sync/attack/:id
```

Manually sync a specific attack to Neo4j (including relationships).

#### Sync IP to Neo4j
```http
POST /api/graph/sync/ip/:id
```

Manually sync a specific IP to Neo4j.

## Data Synchronization

### Automatic Sync (Recommended)

Add hooks to your Mongoose models to automatically sync data to Neo4j:

```javascript
// In Attack model
attackSchema.post('save', async function() {
  try {
    await graphSyncService.syncAttack(this);
  } catch (error) {
    console.error('Neo4j sync error:', error);
  }
});

// In IP model
ipSchema.post('save', async function() {
  try {
    await graphSyncService.syncIP(this);
  } catch (error) {
    console.error('Neo4j sync error:', error);
  }
});
```

### Manual Sync

Use the sync endpoints to manually sync specific entities:

```bash
POST /api/graph/sync/attack/:id
POST /api/graph/sync/ip/:id
```

### Bulk Sync

Create a script to sync all existing data:

```javascript
// scripts/sync-to-neo4j.js
const Attack = require('../models/Attack');
const IP = require('../models/IP');
const graphSyncService = require('../services/graphSyncService');

async function syncAll() {
  const attacks = await Attack.find({});
  for (const attack of attacks) {
    await graphSyncService.syncAttack(attack);
    console.log(`Synced attack ${attack._id}`);
  }
  
  const ips = await IP.find({});
  for (const ip of ips) {
    await graphSyncService.syncIP(ip);
    console.log(`Synced IP ${ip._id}`);
  }
}
```

## Example Cypher Queries

### Find Attack Campaign
```cypher
MATCH (a1:Attack {campaign_id: "CAMP-2025-001"})-[:RELATED_TO*0..]-(a2:Attack)
RETURN a1, a2, a1.date, a2.date
ORDER BY a1.date, a2.date;
```

### Find IP Network
```cypher
MATCH (ip:IP {ip_address: "185.122.54.90"})-[:ASSOCIATED_WITH*1..3]-(related:IP)
RETURN ip, related, length(path) as distance
ORDER BY distance;
```

### Find Threat Intelligence Chain
```cypher
MATCH path = (ti1:ThreatIntelligence {indicator: "malicious-hash"})-[*1..5]-(ti2:ThreatIntelligence)
RETURN path, ti1, ti2
LIMIT 50;
```

## Performance Considerations

### When to Use Neo4j vs MongoDB

**Use Neo4j for:**
- Relationship traversal queries (find related attacks)
- Campaign detection
- Network analysis (IP associations)
- Multi-hop path queries
- Graph pattern matching

**Use MongoDB for:**
- Document CRUD operations
- Aggregations and statistics
- Full-text search
- Time-series queries
- Complex filtering

### Query Optimization

1. **Limit depth**: Use reasonable `maxDepth` values (typically 1-5)
2. **Use indexes**: Neo4j automatically indexes `id` property
3. **Batch operations**: Sync data in batches, not one-by-one
4. **Cache results**: Cache frequently accessed graph queries

## Troubleshooting

### Connection Issues

If Neo4j connection fails:
- Check if Neo4j is running: `docker ps` or check Neo4j Desktop
- Verify credentials in `.env` file
- Check firewall settings (ports 7474 and 7687)
- Verify Neo4j URI format: `bolt://localhost:7687` or `neo4j://localhost:7687`

### Sync Issues

If data isn't syncing:
- Check Neo4j connection status
- Verify MongoDB document IDs are valid
- Check application logs for sync errors
- Use manual sync endpoints to test

### Performance Issues

If queries are slow:
- Reduce `maxDepth` parameter
- Add more specific filters to queries
- Check Neo4j memory settings
- Consider using Neo4j APOC procedures for complex queries

## Best Practices

1. **Sync Strategy**: Use automatic hooks for new data, manual sync for bulk operations
2. **Error Handling**: Always wrap Neo4j operations in try-catch blocks
3. **Graceful Degradation**: App should work even if Neo4j is unavailable
4. **Data Consistency**: Keep MongoDB as source of truth; Neo4j is for relationships
5. **Regular Syncs**: Run periodic sync jobs to ensure graph is up-to-date

## References

- [Neo4j Documentation](https://neo4j.com/docs/)
- [Neo4j JavaScript Driver](https://neo4j.com/docs/javascript-manual/current/)
- [Cypher Query Language](https://neo4j.com/docs/cypher-manual/current/)
- [Neo4j Browser](http://localhost:7474) (when Neo4j is running)

