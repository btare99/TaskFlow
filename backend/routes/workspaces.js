const express = require('express');
const crypto = require('crypto');
const Workspace = require('../models/Workspace');
const { Board } = require('../models/Board');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendInviteEmail } = require('../utils/email');

const router = express.Router();

const LIMITS = {
  free: { workspaces: 1, boards: 3, members: 5 },
  pro: { workspaces: 3, boards: 99999, members: 15 },
  team: { workspaces: 99999, boards: 99999, members: 99999 },
};

router.get('/', protect, async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    }).populate('owner', 'name email avatar');
    const withCounts = await Promise.all(workspaces.map(async ws => {
      const boardCount = await Board.countDocuments({ workspace: ws._id, isArchived: false });
      return { ...ws.toObject(), boardCount };
    }));
    res.json(withCounts);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const plan = req.user.subscription?.plan || 'free';
    const count = await Workspace.countDocuments({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    });
    if (count >= LIMITS[plan].workspaces) {
      return res.status(403).json({ message: `Plan "${plan}" lejon max ${LIMITS[plan].workspaces} workspace.`, upgradeRequired: true });
    }
    const { name, description, color } = req.body;
    const workspace = await Workspace.create({
      name, description, color: color || '#6366f1', owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }],
    });
    res.status(201).json(workspace);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');
    if (!workspace) return res.status(404).json({ message: 'Workspace nuk u gjet.' });
    const isMember = workspace.members.some(m => m.user._id.toString() === req.user._id.toString());
    const isOwner = workspace.owner._id.toString() === req.user._id.toString();
    if (!isMember && !isOwner) return res.status(403).json({ message: 'Qasje e mohuar.' });
    const boards = await Board.find({ workspace: workspace._id, isArchived: false }).sort({ createdAt: -1 });
    res.json({ ...workspace.toObject(), boards });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/:id', protect, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Workspace nuk u gjet.' });
    const isOwner = workspace.owner.toString() === req.user._id.toString();
    const isAdmin = workspace.members.find(m => m.user.toString() === req.user._id.toString() && m.role === 'admin');
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Nuk keni leje.' });
    const { name, description, color } = req.body;
    if (name) workspace.name = name;
    if (description !== undefined) workspace.description = description;
    if (color) workspace.color = color;
    await workspace.save();
    res.json(workspace);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Workspace nuk u gjet.' });
    if (workspace.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Vetëm pronari mund ta fshijë.' });
    await Board.deleteMany({ workspace: workspace._id });
    await workspace.deleteOne();
    res.json({ message: 'Workspace u fshi.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:id/invite', protect, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id).populate('owner', 'name email');
    if (!workspace) return res.status(404).json({ message: 'Workspace nuk u gjet.' });
    const plan = req.user.subscription?.plan || 'free';
    if (workspace.members.length >= LIMITS[plan].members)
      return res.status(403).json({ message: `Plani juaj lejon max ${LIMITS[plan].members} anëtarë.`, upgradeRequired: true });
    const { email, role = 'member' } = req.body;
    let invitedUser = await User.findOne({ email });
    if (invitedUser) {
      const alreadyMember = workspace.members.some(m => m.user.toString() === invitedUser._id.toString());
      if (alreadyMember) return res.status(409).json({ message: 'Ky përdorues është tashmë anëtar.' });
      workspace.members.push({ user: invitedUser._id, role });
      await workspace.save();
    }
    const inviteToken = crypto.randomBytes(16).toString('hex');
    workspace.inviteToken = inviteToken;
    await workspace.save();
    const inviteLink = `${process.env.CLIENT_URL}/invite/${workspace._id}?token=${inviteToken}`;
    await sendInviteEmail({ to: email, inviterName: req.user.name, workspaceName: workspace.name, inviteLink });
    res.json({ message: `Ftesa u dërgua te ${email}.` });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id/members/:userId', protect, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Workspace nuk u gjet.' });
    const isOwner = workspace.owner.toString() === req.user._id.toString();
    const isAdmin = workspace.members.find(m => m.user.toString() === req.user._id.toString() && m.role === 'admin');
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Nuk keni leje.' });
    workspace.members = workspace.members.filter(m => m.user.toString() !== req.params.userId);
    await workspace.save();
    res.json({ message: 'Anëtari u hoq.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/:id/members/:userId', protect, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Workspace nuk u gjet.' });
    if (workspace.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Vetëm pronari mund të ndryshojë rolet.' });
    const member = workspace.members.find(m => m.user.toString() === req.params.userId);
    if (!member) return res.status(404).json({ message: 'Anëtari nuk u gjet.' });
    member.role = req.body.role;
    await workspace.save();
    res.json({ message: 'Roli u përditësua.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
