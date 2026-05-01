const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT and attach user to request
const protect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Nuk jeni të autentifikuar.' });
    }

    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'Përdoruesi nuk ekziston.' });

    // Update lastSeen
    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token i pavlefshëm ose ka skaduar.' });
  }
};

// Require platform admin role
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Kjo veprim kërkon akses admin.' });
  }
  next();
};

// Require specific workspace role
// Usage: requireWorkspaceRole(['owner', 'admin'])
const requireWorkspaceRole = (roles) => async (req, res, next) => {
  const Workspace = require('../models/Workspace');
  const workspaceId = req.params.workspaceId || req.body.workspaceId;

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) return res.status(404).json({ message: 'Workspace nuk u gjet.' });

  const member = workspace.members.find(m => m.user.toString() === req.user._id.toString());
  const isOwner = workspace.owner.toString() === req.user._id.toString();

  if (isOwner) {
    req.workspace = workspace;
    req.workspaceMemberRole = 'owner';
    return next();
  }

  if (!member || !roles.includes(member.role)) {
    return res.status(403).json({ message: 'Nuk keni leje për këtë veprim.' });
  }

  req.workspace = workspace;
  req.workspaceMemberRole = member.role;
  next();
};

// Check subscription plan
const requirePlan = (plans) => (req, res, next) => {
  const userPlan = req.user?.subscription?.plan || 'free';
  if (!plans.includes(userPlan)) {
    return res.status(403).json({ 
      message: 'Ky funksion kërkon një plan premium.',
      upgradeRequired: true,
      currentPlan: userPlan,
    });
  }
  next();
};

// Sign JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

module.exports = { protect, requireAdmin, requireWorkspaceRole, requirePlan, signToken };
