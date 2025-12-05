const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // Identification
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'SYNC', 'OTHER']
  },
  resource_type: {
    type: String,
    enum: ['Attack', 'IP', 'User', 'Source', 'Report', 'Alert', 'ThreatIntelligence', 'Vulnerability', 'System'],
    required: true
  },
  resource_id: mongoose.Schema.Types.ObjectId,
  
  // Utilisateur
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: String,
  ip_address: String,
  user_agent: String,
  
  // Détails
  description: String,
  details: mongoose.Schema.Types.Mixed,
  
  // Changements
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
    fields_changed: [String]
  },
  
  // Résultat
  status: {
    type: String,
    enum: ['Success', 'Failed', 'Partial'],
    default: 'Success'
  },
  error_message: String,
  
  // Métadonnées
  timestamp: { type: Date, default: Date.now, required: true },
  duration_ms: Number,
  
  // Sécurité
  risk_level: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Low'
  },
  is_suspicious: { type: Boolean, default: false },
  
  // Tags
  tags: [String]
});

// Index
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ user_id: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ resource_type: 1, resource_id: 1 });
auditLogSchema.index({ ip_address: 1 });
auditLogSchema.index({ status: 1 });
auditLogSchema.index({ risk_level: 1 });
auditLogSchema.index({ is_suspicious: 1 });

// TTL Index pour auto-suppression après 1 an (optionnel)
// auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

