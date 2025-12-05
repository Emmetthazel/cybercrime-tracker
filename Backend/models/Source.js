const mongoose = require('mongoose');

const sourceSchema = new mongoose.Schema({
  // Identification
  name: { type: String, required: true, unique: true },
  display_name: String,
  type: {
    type: String,
    enum: ['API', 'RSS', 'CSV', 'Manual', 'Webhook'],
    required: true
  },
  category: String,
  
  // Configuration API
  api_endpoint: String,
  api_key: String, // Devrait être chiffré en production
  api_version: String,
  authentication_method: {
    type: String,
    enum: ['API_KEY', 'OAuth', 'Basic', 'Bearer'],
    default: 'API_KEY'
  },
  
  // Paramètres de synchronisation
  sync_enabled: { type: Boolean, default: true },
  sync_interval: { type: Number, default: 3600 }, // En secondes
  last_sync: Date,
  next_sync: Date,
  sync_status: {
    type: String,
    enum: ['Success', 'Failed', 'In Progress'],
    default: 'Success'
  },
  
  // Statistiques
  records_collected: { type: Number, default: 0 },
  total_syncs: { type: Number, default: 0 },
  successful_syncs: { type: Number, default: 0 },
  failed_syncs: { type: Number, default: 0 },
  average_response_time: Number, // En secondes
  
  // Fiabilité et qualité
  is_active: { type: Boolean, default: true },
  reliability_score: { type: Number, min: 0, max: 100, default: 50 },
  data_quality_score: { type: Number, min: 0, max: 100, default: 50 },
  
  // Gestion des erreurs
  error_count: { type: Number, default: 0 },
  last_error: String,
  last_error_date: Date,
  consecutive_errors: { type: Number, default: 0 },
  max_consecutive_errors: { type: Number, default: 5 },
  
  // Rate limiting
  rate_limit: Number,
  rate_limit_period: String,
  current_usage: { type: Number, default: 0 },
  rate_limit_reset: Date,
  
  // Configuration avancée
  configuration: {
    endpoint_paths: mongoose.Schema.Types.Mixed,
    default_params: mongoose.Schema.Types.Mixed,
    retry_config: {
      max_retries: { type: Number, default: 3 },
      retry_delay: { type: Number, default: 5000 },
      backoff_multiplier: { type: Number, default: 2 }
    },
    timeout: { type: Number, default: 30000 },
    headers: mongoose.Schema.Types.Mixed
  },
  
  // Mapping des données
  data_mapping: mongoose.Schema.Types.Mixed,
  
  // Filtres et transformations
  filters: {
    min_confidence_score: Number,
    countries: [String],
    categories: [Number]
  },
  
  // Coûts (si applicable)
  pricing: {
    plan: String,
    cost_per_month: Number,
    currency: { type: String, default: 'USD' },
    requests_included: Number
  },
  
  // Webhook (si applicable)
  webhook: {
    enabled: { type: Boolean, default: false },
    url: String,
    secret: String,
    events: [String]
  },
  
  // Documentation et support
  documentation_url: String,
  support_email: String,
  terms_of_service_url: String,
  
  // Métadonnées
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// Index
sourceSchema.index({ name: 1 }, { unique: true });
sourceSchema.index({ type: 1 });
sourceSchema.index({ is_active: 1 });
sourceSchema.index({ next_sync: 1 });
sourceSchema.index({ reliability_score: -1 });

// Middleware pour mettre à jour updated_at
sourceSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Source', sourceSchema);

