const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  port: Number,
  service: String,
  version: String,
  banner: String,
  ssl_cert: {
    issuer: String,
    valid_from: Date,
    valid_to: Date
  }
}, { _id: false });

const analystCommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  comment: String,
  created_at: { type: Date, default: Date.now }
}, { _id: false });

const actionTakenSchema = new mongoose.Schema({
  action: String,
  performed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performed_at: { type: Date, default: Date.now }
}, { _id: false });

const ipSchema = new mongoose.Schema({
  // Identification
  ip_address: { type: String, required: true, unique: true },
  ip_version: { type: Number, enum: [4, 6], default: 4 },
  
  // Géolocalisation
  country: String,
  country_code: String,
  city: String,
  region: String,
  postal_code: String,
  geolocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  
  // Informations réseau
  isp: String,
  organization: String,
  asn: String,
  asn_name: String,
  
  // Tracking et statistiques
  reported_count: { type: Number, default: 0 },
  attack_count: { type: Number, default: 0 },
  first_seen: { type: Date, default: Date.now },
  last_report: Date,
  last_activity: { type: Date, default: Date.now },
  
  // Scores et réputation
  threat_score: { type: Number, min: 0, max: 100, default: 0 },
  reputation_score: { type: Number, min: 0, max: 100, default: 100 },
  risk_level: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Low'
  },
  
  // Blacklist
  is_blacklisted: { type: Boolean, default: false },
  blacklisted_at: Date,
  blacklist_sources: [String],
  blacklist_reason: String,
  
  // Données WHOIS
  whois_data: {
    registrar: String,
    created_date: Date,
    updated_date: Date,
    expiry_date: Date,
    nameservers: [String],
    registrant: String
  },
  
  // Domaines associés
  associated_domains: [String],
  
  // Menaces associées
  malware_families: [String],
  attack_types: [String],
  
  // Attaques liées
  attacks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attack' }],
  
  // Informations techniques
  open_ports: [Number],
  services: [serviceSchema],
  
  // Enrichissement via APIs
  virustotal_data: {
    last_analysis_date: Date,
    malicious: Number,
    suspicious: Number,
    harmless: Number,
    undetected: Number,
    reputation: Number,
    url: String
  },
  
  abuseipdb_data: {
    abuse_confidence_score: Number,
    total_reports: Number,
    num_distinct_users: Number,
    last_reported: Date,
    categories: [Number],
    country_code: String
  },
  
  shodan_data: {
    last_scan: Date,
    hostnames: [String],
    tags: [String],
    vulns: [String]
  },
  
  // Statut et actions
  is_active: { type: Boolean, default: true },
  is_tor_exit_node: { type: Boolean, default: false },
  is_proxy: { type: Boolean, default: false },
  is_vpn: { type: Boolean, default: false },
  
  // Notes et commentaires
  notes: String,
  analyst_comments: [analystCommentSchema],
  
  // Actions entreprises
  actions_taken: [actionTakenSchema],
  
  // Métadonnées
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  last_enrichment: Date,
  enrichment_sources: [String]
});

// Index
ipSchema.index({ ip_address: 1 }, { unique: true });
ipSchema.index({ threat_score: -1 });
ipSchema.index({ is_blacklisted: 1 });
ipSchema.index({ country: 1 });
ipSchema.index({ last_activity: -1 });
ipSchema.index({ attack_types: 1 });
ipSchema.index({ malware_families: 1 });
ipSchema.index({ geolocation: '2dsphere' });
ipSchema.index({ is_active: 1, threat_score: -1 });

// Middleware pour mettre à jour updated_at
ipSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('IP', ipSchema);

