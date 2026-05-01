const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'admin', 'member', 'viewer'], default: 'member' },
  joinedAt: { type: Date, default: Date.now },
});

const workspaceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500 },
  slug: { type: String, unique: true },
  logo: { type: String, default: '' },
  color: { type: String, default: '#6366f1' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [memberSchema],
  plan: { type: String, enum: ['free', 'pro', 'team'], default: 'free' },
  inviteToken: { type: String },
  settings: {
    allowMemberInvite: { type: Boolean, default: true },
    visibility: { type: String, enum: ['private', 'public'], default: 'private' },
  },
}, { timestamps: true });

// Auto-generate slug
workspaceSchema.pre('save', async function (next) {
  if (!this.isModified('name')) return next();
  const base = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  this.slug = `${base}-${Date.now().toString(36)}`;
  next();
});

// Virtual for board count (populated separately)
workspaceSchema.virtual('boardCount', {
  ref: 'Board',
  localField: '_id',
  foreignField: 'workspace',
  count: true,
});

module.exports = mongoose.model('Workspace', workspaceSchema);
