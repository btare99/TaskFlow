const express = require('express');
const { Board, Column, Card } = require('../models/Board');
const Workspace = require('../models/Workspace');
const { protect } = require('../middleware/auth');

const router = express.Router();

const LIMITS = {
  free: { boards: 3 },
  pro: { boards: 99999 },
  team: { boards: 99999 },
};

const DEFAULT_COLUMNS = ['Të bëra', 'Në progres', 'Rishikim', 'Përfunduar'];

// Helper: check workspace membership
const checkWorkspaceAccess = async (workspaceId, userId, roles = null) => {
  const ws = await Workspace.findById(workspaceId);
  if (!ws) return null;
  const isOwner = ws.owner.toString() === userId.toString();
  const member = ws.members.find(m => m.user.toString() === userId.toString());
  if (!isOwner && !member) return null;
  if (roles) {
    const role = isOwner ? 'owner' : member?.role;
    if (!roles.includes(role)) return null;
  }
  return ws;
};

// ─── LIST BOARDS ───────────────────────────────────────────────────────────
router.get('/workspace/:workspaceId', protect, async (req, res) => {
  try {
    const ws = await checkWorkspaceAccess(req.params.workspaceId, req.user._id);
    if (!ws) return res.status(403).json({ message: 'Qasje e mohuar.' });
    const boards = await Board.find({ workspace: req.params.workspaceId, isArchived: false })
      .sort({ createdAt: -1 });
    res.json(boards);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── CREATE BOARD ──────────────────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { workspaceId, title, background } = req.body;
    const ws = await checkWorkspaceAccess(workspaceId, req.user._id, ['owner', 'admin', 'member']);
    if (!ws) return res.status(403).json({ message: 'Qasje e mohuar.' });

    const plan = req.user.subscription?.plan || 'free';
    const count = await Board.countDocuments({ workspace: workspaceId, isArchived: false });
    if (count >= LIMITS[plan].boards)
      return res.status(403).json({ message: `Plani "${plan}" lejon max ${LIMITS[plan].boards} board.`, upgradeRequired: true });

    const board = await Board.create({
      title, background: background || '#6366f1',
      workspace: workspaceId, createdBy: req.user._id, members: [req.user._id],
    });

    // Create default columns
    const columnDocs = DEFAULT_COLUMNS.map((title, i) => ({ title, order: i, board: board._id }));
    await Column.insertMany(columnDocs);

    res.status(201).json(board);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── GET FULL BOARD (with columns + cards) ─────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id).populate('createdBy', 'name avatar');
    if (!board) return res.status(404).json({ message: 'Board nuk u gjet.' });
    const ws = await checkWorkspaceAccess(board.workspace, req.user._id);
    if (!ws) return res.status(403).json({ message: 'Qasje e mohuar.' });

    const columns = await Column.find({ board: board._id }).sort({ order: 1 });
    const cards = await Card.find({ board: board._id })
      .populate('assignees', 'name avatar email')
      .populate('createdBy', 'name avatar')
      .sort({ order: 1 });

    const columnsWithCards = columns.map(col => ({
      ...col.toObject(),
      cards: cards.filter(c => c.column.toString() === col._id.toString()),
    }));

    res.json({ ...board.toObject(), columns: columnsWithCards });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── UPDATE BOARD ──────────────────────────────────────────────────────────
router.patch('/:id', protect, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board nuk u gjet.' });
    const ws = await checkWorkspaceAccess(board.workspace, req.user._id, ['owner', 'admin', 'member']);
    if (!ws) return res.status(403).json({ message: 'Qasje e mohuar.' });
    const { title, background, isStarred, isArchived } = req.body;
    if (title !== undefined) board.title = title;
    if (background !== undefined) board.background = background;
    if (isStarred !== undefined) board.isStarred = isStarred;
    if (isArchived !== undefined) board.isArchived = isArchived;
    await board.save();
    res.json(board);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── DELETE BOARD ──────────────────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board nuk u gjet.' });
    const ws = await checkWorkspaceAccess(board.workspace, req.user._id, ['owner', 'admin']);
    if (!ws) return res.status(403).json({ message: 'Nuk keni leje.' });
    await Column.deleteMany({ board: board._id });
    await Card.deleteMany({ board: board._id });
    await board.deleteOne();
    res.json({ message: 'Board u fshi.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── COLUMNS ───────────────────────────────────────────────────────────────
router.post('/:boardId/columns', protect, async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) return res.status(404).json({ message: 'Board nuk u gjet.' });
    const ws = await checkWorkspaceAccess(board.workspace, req.user._id, ['owner', 'admin', 'member']);
    if (!ws) return res.status(403).json({ message: 'Qasje e mohuar.' });
    const count = await Column.countDocuments({ board: board._id });
    const column = await Column.create({ title: req.body.title, order: count, board: board._id });
    res.status(201).json(column);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/columns/:columnId', protect, async (req, res) => {
  try {
    const column = await Column.findById(req.params.columnId);
    if (!column) return res.status(404).json({ message: 'Kolona nuk u gjet.' });
    const board = await Board.findById(column.board);
    const ws = await checkWorkspaceAccess(board.workspace, req.user._id, ['owner', 'admin', 'member']);
    if (!ws) return res.status(403).json({ message: 'Qasje e mohuar.' });
    if (req.body.title !== undefined) column.title = req.body.title;
    if (req.body.order !== undefined) column.order = req.body.order;
    await column.save();
    res.json(column);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/columns/:columnId', protect, async (req, res) => {
  try {
    const column = await Column.findById(req.params.columnId);
    if (!column) return res.status(404).json({ message: 'Kolona nuk u gjet.' });
    const board = await Board.findById(column.board);
    const ws = await checkWorkspaceAccess(board.workspace, req.user._id, ['owner', 'admin']);
    if (!ws) return res.status(403).json({ message: 'Nuk keni leje.' });
    await Card.deleteMany({ column: column._id });
    await column.deleteOne();
    res.json({ message: 'Kolona u fshi.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── CARDS ────────────────────────────────────────────────────────────────
router.post('/cards', protect, async (req, res) => {
  try {
    const { columnId, boardId, title, description, priority, dueDate, assignees } = req.body;
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: 'Board nuk u gjet.' });
    const ws = await checkWorkspaceAccess(board.workspace, req.user._id, ['owner', 'admin', 'member']);
    if (!ws) return res.status(403).json({ message: 'Qasje e mohuar.' });
    const count = await Card.countDocuments({ column: columnId });
    const card = await Card.create({
      title, description, priority, dueDate,
      assignees: assignees || [req.user._id],
      column: columnId, board: boardId,
      order: count, createdBy: req.user._id,
    });
    const populated = await card.populate('assignees createdBy', 'name avatar email');
    res.status(201).json(populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/cards/:cardId', protect, async (req, res) => {
  try {
    const card = await Card.findById(req.params.cardId);
    if (!card) return res.status(404).json({ message: 'Karta nuk u gjet.' });
    const board = await Board.findById(card.board);
    const ws = await checkWorkspaceAccess(board.workspace, req.user._id, ['owner', 'admin', 'member']);
    if (!ws) return res.status(403).json({ message: 'Qasje e mohuar.' });
    const fields = ['title', 'description', 'priority', 'dueDate', 'assignees', 'labels', 'column', 'order', 'checklist'];
    fields.forEach(f => { if (req.body[f] !== undefined) card[f] = req.body[f]; });
    await card.save();
    await card.populate('assignees createdBy', 'name avatar email');
    res.json(card);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/cards/:cardId', protect, async (req, res) => {
  try {
    const card = await Card.findById(req.params.cardId);
    if (!card) return res.status(404).json({ message: 'Karta nuk u gjet.' });
    const board = await Board.findById(card.board);
    const ws = await checkWorkspaceAccess(board.workspace, req.user._id, ['owner', 'admin', 'member']);
    if (!ws) return res.status(403).json({ message: 'Qasje e mohuar.' });
    await card.deleteOne();
    res.json({ message: 'Karta u fshi.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── ADD COMMENT ───────────────────────────────────────────────────────────
router.post('/cards/:cardId/comments', protect, async (req, res) => {
  try {
    const card = await Card.findById(req.params.cardId);
    if (!card) return res.status(404).json({ message: 'Karta nuk u gjet.' });
    card.comments.push({ author: req.user._id, text: req.body.text });
    await card.save();
    await card.populate('comments.author', 'name avatar');
    res.status(201).json(card.comments[card.comments.length - 1]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── REORDER (Drag & Drop) ─────────────────────────────────────────────────
router.post('/:boardId/reorder', protect, async (req, res) => {
  try {
    const { updates } = req.body;
    // updates: [{ cardId, column, order }]
    await Promise.all(updates.map(u =>
      Card.findByIdAndUpdate(u.cardId, { column: u.column, order: u.order })
    ));
    res.json({ message: 'Renditja u përditësua.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
