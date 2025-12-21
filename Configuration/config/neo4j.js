const neo4j = require('neo4j-driver');
const config = require('./config');

// Track if we've set up event listeners
let driver = null;

/**
 * Connect to Neo4j database
 * @returns {neo4j.Driver} Neo4j driver instance
 */
const connectNeo4j = async () => {
  try {
    // If driver already exists and is connected, return it
    if (driver) {
      try {
        await driver.verifyConnectivity();
        return driver;
      } catch (error) {
        // Driver exists but not connected, create new one
        console.log('Neo4j driver exists but not connected, creating new connection...');
        await driver.close();
        driver = null;
      }
    }

    // Create new driver instance
    console.log('🔌 Connecting to Neo4j...');
    driver = neo4j.driver(
      config.NEO4J_URI,
      neo4j.auth.basic(config.NEO4J_USER, config.NEO4J_PASSWORD),
      {
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 60000,
        encrypted: config.NEO4J_URI.startsWith('neo4j://') || config.NEO4J_URI.startsWith('neo4j+s://'),
      }
    );

    // Verify connectivity
    await driver.verifyConnectivity();
    console.log('✅ Neo4j connection established successfully');
    console.log(`   URI: ${config.NEO4J_URI}`);
    console.log(`   Database: ${config.NEO4J_DATABASE}`);
    console.log(`   User: ${config.NEO4J_USER}`);

    return driver;
  } catch (error) {
    console.error('❌ Error connecting to Neo4j:', error.message);
    console.error('   Please ensure Neo4j is running and credentials are correct');
    console.error(`   Default URI: ${config.NEO4J_URI}`);
    // Don't exit process - allow app to continue without Neo4j if optional
    throw error;
  }
};

/**
 * Get Neo4j driver instance (creates connection if needed)
 * @returns {neo4j.Driver} Neo4j driver instance
 */
const getDriver = () => {
  if (!driver) {
    throw new Error('Neo4j driver not initialized. Call connectNeo4j() first.');
  }
  return driver;
};

/**
 * Get a Neo4j session
 * @param {string} database - Database name (optional, uses default if not provided)
 * @returns {neo4j.Session} Neo4j session
 */
const getSession = (database = config.NEO4J_DATABASE) => {
  const driver = getDriver();
  return driver.session({
    database: database,
    defaultAccessMode: neo4j.session.WRITE,
  });
};

/**
 * Execute a read transaction
 * @param {Function} callback - Function that receives a transaction and returns a promise
 * @param {string} database - Database name (optional)
 * @returns {Promise} Result of the transaction
 */
const readTransaction = async (callback, database = config.NEO4J_DATABASE) => {
  const session = getSession(database);
  try {
    // Neo4j driver 6.x uses executeRead instead of readTransaction
    return await session.executeRead(callback);
  } finally {
    await session.close();
  }
};

/**
 * Execute a write transaction
 * @param {Function} callback - Function that receives a transaction and returns a promise
 * @param {string} database - Database name (optional)
 * @returns {Promise} Result of the transaction
 */
const writeTransaction = async (callback, database = config.NEO4J_DATABASE) => {
  const session = getSession(database);
  try {
    // Neo4j driver 6.x uses executeWrite instead of writeTransaction
    return await session.executeWrite(callback);
  } finally {
    await session.close();
  }
};

/**
 * Close Neo4j driver connection
 */
const closeNeo4j = async () => {
  if (driver) {
    try {
      await driver.close();
      console.log('✅ Neo4j connection closed');
      driver = null;
    } catch (error) {
      console.error('Error closing Neo4j connection:', error.message);
    }
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  await closeNeo4j();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeNeo4j();
  process.exit(0);
});

module.exports = {
  connectNeo4j,
  getDriver,
  getSession,
  readTransaction,
  writeTransaction,
  closeNeo4j,
};

