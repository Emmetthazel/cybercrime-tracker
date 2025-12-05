const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  // Identification
  title: { type: String, required: true },
  alert_type: {
    type: String,
    enum: ['Attack Detected', 'High Severity', 'Critical Severity', 'IP Blacklisted', 'Anomaly Detected', 'System Alert', 'Custom'],
    required: true
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  
  // Contenu
  description: { type: String, required: true },
  message: String,
  
  // Source et contexte
  source_type: {
    type: String,
    enum: ['Attack', 'IP', 'System', 'External API', 'Custom Rule'],
    required: true
  },
  source_id: { type: mongoose.Schema.Types.ObjectId, refPath: 'source_model' },
  source_model: {
    type: String,
    enum: ['Attack', 'IP', null]
  },
  
  // Règles et conditions
  trigger_conditions: mongoose.Schema.Types.Mixed,
  rule_name: String,
  
  // Statut
  status: {
    type: String,
    enum: ['Active', 'Acknowledged', 'Resolved', 'Dismissed'],
    default: 'Active'
  },
  acknowledged_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acknowledged_at: Date,
  resolved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolved_at: Date,
  
  // Notifications
  notifications_sent: { type: Boolean, default: false },
  notification_channels: [{
    type: { type: String, enum: ['Email', 'SMS', 'Push', 'Webhook'] },
    sent_at: Date,
    recipient: String,
    status: { type: String, enum: ['Sent', 'Failed', 'Pending'] }
  }],
  
  // Actions
  actions_taken: [{
    action: String,
    performed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    performed_at: { type: Date, default: Date.now }
  }],
  
  // Métadonnées
  tags: [String],
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  expires_at: Date,
  auto_resolve: { type: Boolean, default: false },
  
  // Timestamps
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Index
alertSchema.index({ status: 1 });
alertSchema.index({ severity: 1 });
alertSchema.index({ alert_type: 1 });
alertSchema.index({ created_at: -1 });
alertSchema.index({ source_id: 1, source_model: 1 });
alertSchema.index({ acknowledged_by: 1 });
alertSchema.index({ expires_at: 1 });

// Middleware pour mettre à jour updated_at
alertSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Alert', alertSchema);

