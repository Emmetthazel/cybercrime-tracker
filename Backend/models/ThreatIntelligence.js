const mongoose = require('mongoose');

const threatIntelligenceSchema = new mongoose.Schema({
  // Identification
  indicator: { type: String, required: true },
  indicator_type: {
    type: String,
    enum: ['ip', 'domain', 'url', 'hash', 'email', 'filename', 'registry_key', 'other'],
    required: true
  },
  
  // Classification
  threat_type: {
    type: String,
    enum: ['Malware', 'Phishing', 'C2', 'Exploit', 'APT', 'Ransomware', 'Trojan', 'Botnet', 'Other']
  },
  threat_family: String,
  threat_actor: String,
  
  // Scores et réputation
  threat_score: { type: Number, min: 0, max: 100, default: 0 },
  confidence_level: { type: Number, min: 0, max: 100, default: 50 },
  reputation: {
    type: String,
    enum: ['Malicious', 'Suspicious', 'Unknown', 'Benign'],
    default: 'Unknown'
  },
  
  // Statut
  is_active: { type: Boolean, default: true },
  first_seen: { type: Date, default: Date.now },
  last_seen: { type: Date, default: Date.now },
  expires_at: Date,
  
  // Sources
  sources: [{
    name: String,
    source_type: {
      type: String,
      enum: ['VirusTotal', 'AbuseIPDB', 'Shodan', 'OTX', 'Internal', 'Manual', 'Other']
    },
    first_seen: Date,
    last_seen: Date,
    detection_count: Number,
    source_url: String
  }],
  
  // Contexte
  description: String,
  context: String,
  related_indicators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ThreatIntelligence' }],
  related_attacks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attack' }],
  
  // Métadonnées techniques
  metadata: {
    file_type: String,
    file_size: Number,
    md5: String,
    sha1: String,
    sha256: String,
    ssdeep: String,
    asn: String,
    country: String,
    registrar: String,
    creation_date: Date,
    expiration_date: Date
  },
  
  // Actions
  actions: [{
    action: String,
    performed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    performed_at: { type: Date, default: Date.now }
  }],
  
  // Tags et classification
  tags: [String],
  mitre_attack_techniques: [String],
  kill_chain_phase: {
    type: String,
    enum: ['Reconnaissance', 'Weaponization', 'Delivery', 'Exploitation', 'Installation', 'Command and Control', 'Actions on Objectives']
  },
  
  // Timestamps
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// Index
threatIntelligenceSchema.index({ indicator: 1, indicator_type: 1 });
threatIntelligenceSchema.index({ threat_type: 1 });
threatIntelligenceSchema.index({ threat_score: -1 });
threatIntelligenceSchema.index({ is_active: 1 });
threatIntelligenceSchema.index({ first_seen: -1 });
threatIntelligenceSchema.index({ last_seen: -1 });
threatIntelligenceSchema.index({ reputation: 1 });
threatIntelligenceSchema.index({ tags: 1 });
threatIntelligenceSchema.index({ 'metadata.md5': 1 });
threatIntelligenceSchema.index({ 'metadata.sha256': 1 });

// Middleware pour mettre à jour updated_at
threatIntelligenceSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('ThreatIntelligence', threatIntelligenceSchema);

