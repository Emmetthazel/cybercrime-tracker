const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Ensure this model can work even if connection is not ready
// Mongoose will buffer operations automatically

const refreshTokenSchema = new mongoose.Schema({
  token: String,
  created_at: { type: Date, default: Date.now },
  expires_at: Date,
  device: String,
  ip_address: String
}, { _id: false });

const activeSessionSchema = new mongoose.Schema({
  session_id: String,
  device: String,
  ip_address: String,
  user_agent: String,
  created_at: { type: Date, default: Date.now },
  last_activity: { type: Date, default: Date.now }
}, { _id: false });

const userSchema = new mongoose.Schema({
  // Identification
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  full_name: String,
  
  // Authentification
  password: { type: String, required: true },
  password_last_changed: { type: Date, default: Date.now },
  password_history: [{
    password: String,
    changed_at: Date
  }],
  
  // Tokens
  api_token: String,
  api_token_created: Date,
  api_token_expires: Date,
  refresh_tokens: [refreshTokenSchema],
  
  // Rôle et permissions
  role: {
    type: String,
    enum: ['admin', 'analyst', 'user', 'viewer'],
    default: 'user'
  },
  permissions: [String],
  
  // Informations organisationnelles
  organization: String,
  department: String,
  job_title: String,
  phone: String,
  office_location: String,
  
  // Statut
  is_active: { type: Boolean, default: true },
  is_verified: { type: Boolean, default: false },
  is_locked: { type: Boolean, default: false },
  locked_until: Date,
  
  // Tracking de connexion
  last_login: Date,
  last_login_ip: String,
  login_count: { type: Number, default: 0 },
  failed_login_attempts: { type: Number, default: 0 },
  last_failed_login: Date,
  
  // Sécurité
  two_factor_enabled: { type: Boolean, default: false },
  two_factor_secret: String,
  two_factor_backup_codes: [String],
  security_questions: [{
    question: String,
    answer: String
  }],
  
  // Préférences
  preferences: {
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    date_format: { type: String, default: 'YYYY-MM-DD' },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    email_notifications: { type: Boolean, default: true },
    sms_notifications: { type: Boolean, default: false },
    push_notifications: { type: Boolean, default: true }
  },
  
  // Notifications
  notification_preferences: {
    new_attack_high_severity: { type: Boolean, default: true },
    new_attack_critical_severity: { type: Boolean, default: true },
    alert_triggered: { type: Boolean, default: true },
    report_generated: { type: Boolean, default: false },
    system_updates: { type: Boolean, default: false },
    digest_frequency: {
      type: String,
      enum: ['real-time', 'hourly', 'daily', 'weekly'],
      default: 'daily'
    }
  },
  
  // Dashboard personnalisé
  dashboard_config: {
    layout: String,
    widgets: [mongoose.Schema.Types.Mixed]
  },
  
  // Statistiques utilisateur
  statistics: {
    attacks_created: { type: Number, default: 0 },
    attacks_resolved: { type: Number, default: 0 },
    reports_generated: { type: Number, default: 0 },
    alerts_acknowledged: { type: Number, default: 0 },
    average_response_time: Number // En minutes
  },
  
  // Session management
  active_sessions: [activeSessionSchema],
  
  // Avatar et profil
  avatar_url: String,
  bio: String,
  social_links: {
    linkedin: String,
    twitter: String
  },
  
  // Métadonnées
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  last_password_reset: Date,
  
  // Compliance
  gdpr_consent: { type: Boolean, default: false },
  gdpr_consent_date: Date,
  terms_accepted: { type: Boolean, default: false },
  terms_accepted_date: Date
});

// Index
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ is_active: 1 });
userSchema.index({ organization: 1 });
userSchema.index({ api_token: 1 });
userSchema.index({ last_login: -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.password_last_changed = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Middleware pour mettre à jour updated_at
userSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);

