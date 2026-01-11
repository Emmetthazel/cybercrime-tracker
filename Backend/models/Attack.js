const mongoose = require('mongoose');

const mitigationActionSchema = new mongoose.Schema({
  action: { type: String, required: true },
  performed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performed_at: { type: Date, default: Date.now },
  effectiveness: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' }
}, { _id: false });

const attackSchema = new mongoose.Schema({
  // Informations de base
  type: {
    type: String,
    required: true,
    enum: ['Phishing', 'DDoS', 'Ransomware', 'Malware', 'SQL Injection', 'XSS', 'Brute Force', 'Man-in-the-Middle', 'Other']
  },
  subtype: String,
  
  // Source de l'attaque
  source_ip: { type: String, required: true },
  source_ip_ref: { type: mongoose.Schema.Types.ObjectId, ref: 'IP' },
  source_country: String,
  source_asn: String,
  source_isp: String,
  
  // Cible de l'attaque
  target_country: { type: String, required: true },
  target_org: String,
  target_sector: {
    type: String,
    enum: ['Education', 'Finance', 'Healthcare', 'Government', 'Technology', 'Other']
  },
  target_systems: [String],
  target_ips: [String],
  
  // Détails temporels
  date: { type: Date, required: true, default: Date.now },
  detected_at: Date,
  duration_seconds: Number,
  timezone: String,
  
  // Gravité et impact
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  severity_score: { type: Number, min: 0, max: 10, default: 5 },
  cvss_score: { type: Number, min: 0, max: 10 },
  confidence_level: { type: Number, min: 0, max: 100, default: 50 },
  
  // Impact quantifié
  data_loss: Number, // En Mo
  financial_impact: Number, // En USD
  affected_users: Number,
  downtime_minutes: Number,
  
  // Description et contexte
  description: { type: String, required: true },
  attack_vector: String,
  attack_pattern: String, // MITRE ATT&CK
  
  // Statut et workflow
  status: {
    type: String,
    enum: ['Detected', 'Under Investigation', 'Contained', 'Mitigated', 'Resolved'],
    default: 'Detected'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Reporting
  reported_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reported_at: { type: Date, default: Date.now },
  verified: { type: Boolean, default: false },
  verified_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Actions de mitigation
  mitigation_actions: [mitigationActionSchema],
  
  // Preuves et forensics
  evidence_files: [String],
  screenshots: [String],
  forensics_data: {
    malware_hash: String,
    c2_servers: [String],
    exfiltration_detected: Boolean,
    persistence_mechanisms: [String]
  },
  
  // Classification et tags
  tags: [String],
  categories: [String],
  threat_actor: String,
  campaign_id: String,
  
  // Relations
  related_attacks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attack' }],
  related_vulnerabilities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vulnerability' }],
  related_indicators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ThreatIntelligence' }],
  
  // Métadonnées
  source: {
    type: String,
    enum: ['Manual Report', 'API Sync', 'Automated Detection'],
    default: 'Manual Report'
  },
  source_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Source' }, // Lien vers la source de Threat Intelligence
  source_reliability: {
    type: String,
    enum: ['A', 'B', 'C'],
    default: 'B'
  },
  
  // Compliance et légal
  gdpr_relevant: { type: Boolean, default: false },
  law_enforcement_notified: { type: Boolean, default: false },
  notification_required: { type: Boolean, default: false },
  breach_notification_date: Date,
  
  // Timestamps
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  
  // Métadonnées de traitement
  processed: { type: Boolean, default: false },
  enriched: { type: Boolean, default: false },
  last_enrichment: Date
});

// Index
attackSchema.index({ date: -1 });
attackSchema.index({ type: 1, severity: 1 });
attackSchema.index({ source_ip: 1 });
attackSchema.index({ target_country: 1 });
attackSchema.index({ status: 1 });
attackSchema.index({ tags: 1 });
attackSchema.index({ threat_actor: 1 });
attackSchema.index({ campaign_id: 1 });
attackSchema.index({ created_at: -1 });
attackSchema.index({ severity_score: -1 });
attackSchema.index({ target_country: 1, type: 1, date: -1 });
attackSchema.index({ description: 'text', attack_vector: 'text', tags: 'text' });
attackSchema.index({ source_id: 1 }); // Index pour les requêtes par source

// Middleware pour mettre à jour updated_at
attackSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Attack', attackSchema);

