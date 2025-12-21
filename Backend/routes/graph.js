const express = require('express');
const router = express.Router();
const graphController = require('../controllers/graphController');
const { authenticate } = require('../middleware/auth');

// All graph routes require authentication
// Attack-related graph queries
router.get('/attacks/:id/related', authenticate, graphController.getRelatedAttacks);
router.get('/ips/:id/attack-chain', authenticate, graphController.getIPAttackChain);
router.get('/ips/:id/associated', authenticate, graphController.getAssociatedIPs);

// Campaign detection
router.get('/campaigns/detect', authenticate, graphController.detectCampaigns);

// Threat intelligence network
router.get('/threat-intelligence/:id/network', authenticate, graphController.getThreatIntelligenceNetwork);

// Graph statistics
router.get('/statistics', authenticate, graphController.getGraphStatistics);

// Sync operations (admin only - you might want to add admin middleware)
router.post('/sync/attack/:id', authenticate, graphController.syncAttack);
router.post('/sync/ip/:id', authenticate, graphController.syncIP);

module.exports = router;

