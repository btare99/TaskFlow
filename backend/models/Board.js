const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, maxlength: 2000 },
  createdAt: { type: Date, default: Date.now },
});

const cardSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  order: { type: Number, required: true },
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  labels: [{ name: String, color: String }],
  dueDate: { type: Date },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  attachments: [{ name: String, url: String }],
  comments: [commentSchema],
  checklist: [{
    text: String,
    done: { type: Boolean, default: false },
  }],
  column: { type: mongoose.Schema.Types.ObjectId, required: true },
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const columnSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  order: { type: Number, required: true },
  color: { type: String, default: '' },
  limit: { type: Number, default: 0 }, // WIP limit, 0 = no limit
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
}, { timestamps: true });

const boardSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, default: '' },
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  background: { type: String, default: '#6366f1' },  // color or image url
  isStarred: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const Board = mongoose.model('Board', boardSchema);
const Column = mongoose.model('Column', columnSchema);
const Card = mongoose.model('Card', cardSchema);

module.exports = { Board, Column, Card };
