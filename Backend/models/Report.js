const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  // Identification
  title: { type: String, required: true },
  report_type: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual', 'Custom', 'Incident'],
    required: true
  },
  report_id: { type: String, unique: true },
  
  // Période couverte
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  
  // Contenu
  summary: String,
  executive_summary: String,
  detailed_analysis: String,
  recommendations: [String],
  
  // Données statistiques
  statistics: {
    total_attacks: { type: Number, default: 0 },
    attacks_by_type: mongoose.Schema.Types.Mixed,
    attacks_by_country: mongoose.Schema.Types.Mixed,
    top_ips: [mongoose.Schema.Types.Mixed],
    severity_distribution: mongoose.Schema.Types.Mixed,
    financial_impact: { type: Number, default: 0 },
    affected_users: { type: Number, default: 0 }
  },
  
  // Filtres appliqués
  filters: {
    date_range: {
      start: Date,
      end: Date
    },
    attack_types: [String],
    countries: [String],
    severity_levels: [String],
    statuses: [String]
  },
  
  // Format et export
  format: {
    type: String,
    enum: ['PDF', 'CSV', 'Excel', 'JSON', 'HTML'],
    default: 'PDF'
  },
  file_path: String,
  file_size: Number,
  
  // Génération
  generated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  generated_at: { type: Date, default: Date.now },
  generation_time_seconds: Number,
  
  // Partage et accès
  is_public: { type: Boolean, default: false },
  shared_with: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  access_count: { type: Number, default: 0 },
  last_accessed: Date,
  
  // Métadonnées
  tags: [String],
  notes: String,
  version: { type: Number, default: 1 },
  
  // Timestamps
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Index
reportSchema.index({ report_id: 1 }, { unique: true });
reportSchema.index({ report_type: 1 });
reportSchema.index({ generated_by: 1 });
reportSchema.index({ start_date: 1, end_date: 1 });
reportSchema.index({ generated_at: -1 });
reportSchema.index({ tags: 1 });

// Middleware pour mettre à jour updated_at
reportSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Report', reportSchema);

