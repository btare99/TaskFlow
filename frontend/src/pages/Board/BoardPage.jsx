import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import { boardsAPI } from '../../services/api';
import { useBoardStore } from '../../store';
import './BoardPage.css';

const PRIORITY_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#f97316', urgent: '#ef4444' };
const PRIORITY_LABELS = { low: 'E ulët', medium: 'Mesme', high: 'E lartë', urgent: 'Urgjente' };

// ─── CARD COMPONENT ────────────────────────────────────────────────────────
function KanbanCard({ card, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card._id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} className={`kanban-card ${isDragging ? 'dragging' : ''}`} {...attributes} {...listeners}>
      <div className="kanban-card__body">
        <p className="kanban-card__title">{card.title}</p>
        {card.description && <p className="kanban-card__desc">{card.description}</p>}
      </div>
      <div className="kanban-card__footer">
        <div className="kanban-card__meta">
          {card.priority && (
            <span className="kanban-card__priority" style={{ color: PRIORITY_COLORS[card.priority] }}>
              ● {PRIORITY_LABELS[card.priority]}
            </span>
          )}
          {card.dueDate && (
            <span className="kanban-card__due">
              📅 {new Date(card.dueDate).toLocaleDateString('sq-AL')}
            </span>
          )}
        </div>
        <div className="kanban-card__assignees">
          {card.assignees?.slice(0, 3).map(a => (
            <div key={a._id} className="avatar avatar-sm" title={a.name}
              style={{ background: 'var(--indigo-light)', color: 'var(--indigo)', marginLeft: -6 }}>
              {a.avatar ? <img src={a.avatar} alt={a.name} style={{ borderRadius: '50%' }} /> : a.name?.[0]}
            </div>
          ))}
        </div>
      </div>
      <div className="kanban-card__actions">
        <button className="kanban-card__btn" onClick={() => onEdit(card)}>✏️</button>
        <button className="kanban-card__btn" onClick={() => onDelete(card._id)}>🗑️</button>
      </div>
    </div>
  );
}

// ─── COLUMN COMPONENT ──────────────────────────────────────────────────────
function KanbanColumn({ column, onAddCard, onEditColumn, onDeleteColumn, onEditCard, onDeleteCard }) {
  return (
    <div className="kanban-column">
      <div className="kanban-column__header">
        <div className="kanban-column__title-row">
          <span className="kanban-column__count">{column.cards.length}</span>
          <h3 className="kanban-column__title">{column.title}</h3>
        </div>
        <div className="kanban-column__actions">
          <button className="btn btn-icon btn-ghost btn-sm" onClick={() => onEditColumn(column)} title="Edito">✏️</button>
          <button className="btn btn-icon btn-ghost btn-sm" onClick={() => onDeleteColumn(column._id)} title="Fshi">🗑️</button>
        </div>
      </div>
      <SortableContext items={column.cards.map(c => c._id)} strategy={verticalListSortingStrategy}>
        <div className="kanban-column__cards">
          {column.cards.map(card => (
            <KanbanCard key={card._id} card={card} onEdit={onEditCard} onDelete={onDeleteCard} />
          ))}
        </div>
      </SortableContext>
      <button className="kanban-column__add" onClick={() => onAddCard(column._id)}>
        + Shto kartë
      </button>
    </div>
  );
}

// ─── CARD MODAL ────────────────────────────────────────────────────────────
function CardModal({ card, columnId, boardId, onClose, onSave }) {
  const isEdit = !!card;
  const [form, setForm] = useState({
    title: card?.title || '',
    description: card?.description || '',
    priority: card?.priority || 'medium',
    dueDate: card?.dueDate ? card.dueDate.split('T')[0] : '',
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Titulli kërkohet.');
    setLoading(true);
    try {
      let res;
      if (isEdit) {
        res = await boardsAPI.updateCard(card._id, form);
      } else {
        res = await boardsAPI.createCard({ ...form, columnId, boardId });
      }
      onSave(res.data, isEdit);
      onClose();
      toast.success(isEdit ? 'Karta u përditësua!' : 'Karta u krijua!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gabim.');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">{isEdit ? 'Edito Kartën' : 'Karta e re'}</h2>
        <form onSubmit={submit}>
          <div className="input-group">
            <label className="input-label">Titulli *</label>
            <input className="input" placeholder="Çfarë duhet bërë?" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="input-group" style={{ marginTop: 14 }}>
            <label className="input-label">Përshkrim</label>
            <textarea className="input textarea" placeholder="Detaje opsionale..."
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
            <div className="input-group">
              <label className="input-label">Prioriteti</label>
              <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="low">E ulët</option>
                <option value="medium">Mesme</option>
                <option value="high">E lartë</option>
                <option value="urgent">Urgjente</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Afati</label>
              <input className="input" type="date" value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Anulo</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Duke ruajtur...' : isEdit ? 'Ruaj' : 'Krijo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── MAIN BOARD PAGE ───────────────────────────────────────────────────────
export default function BoardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentBoard, setBoard, addColumn, removeColumn, addCard, updateCard, removeCard, moveCard } = useBoardStore();
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState(null);
  const [cardModal, setCardModal] = useState({ open: false, card: null, columnId: null });
  const [addColInput, setAddColInput] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    boardsAPI.getOne(id)
      .then(res => setBoard(res.data))
      .catch(() => { toast.error('Board nuk u gjet.'); navigate('/dashboard'); })
      .finally(() => setLoading(false));
  }, [id, navigate, setBoard]);

  const handleDragStart = useCallback(({ active }) => {
    for (const col of currentBoard.columns) {
      const c = col.cards.find(c => c._id === active.id);
      if (c) { setActiveCard(c); return; }
    }
  }, [currentBoard]);

  const handleDragEnd = useCallback(async ({ active, over }) => {
    setActiveCard(null);
    if (!over || active.id === over.id) return;

    let fromCol = null, toCol = null;
    for (const col of currentBoard.columns) {
      if (col.cards.find(c => c._id === active.id)) fromCol = col;
      if (col.cards.find(c => c._id === over.id) || col._id === over.id) toCol = col;
    }
    if (!fromCol || !toCol) return;

    moveCard(active.id, fromCol._id, toCol._id);

    const updates = [];
    for (const col of currentBoard.columns) {
      col.cards.forEach((c, i) => updates.push({ cardId: c._id, column: col._id, order: i }));
    }
    const target = updates.find(u => u.cardId === active.id);
    if (target) target.column = toCol._id;

    try { await boardsAPI.reorder(id, updates); }
    catch { toast.error('Gabim gjatë ruajtjes.'); }
  }, [currentBoard, id, moveCard]);

  const handleAddColumn = async (e) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;
    try {
      const res = await boardsAPI.createColumn(id, { title: newColTitle });
      addColumn(res.data);
      setNewColTitle(''); setAddColInput(false);
      toast.success('Kolona u shtua!');
    } catch (err) { toast.error(err.response?.data?.message || 'Gabim.'); }
  };

  const handleDeleteColumn = async (colId) => {
    if (!confirm('Fshijmë kolonën dhe të gjitha kartat brenda?')) return;
    try {
      await boardsAPI.deleteColumn(colId);
      removeColumn(colId);
      toast.success('Kolona u fshi.');
    } catch { toast.error('Gabim.'); }
  };

  const handleDeleteCard = async (cardId) => {
    try {
      await boardsAPI.deleteCard(cardId);
      removeCard(cardId);
      toast.success('Karta u fshi.');
    } catch { toast.error('Gabim.'); }
  };

  const handleCardSave = (card, isEdit) => {
    if (isEdit) updateCard(card._id, card);
    else addCard(card.column, card);
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!currentBoard) return null;

  const bg = currentBoard.background;
  const isGradient = bg?.includes('#') && bg?.length === 7;

  return (
    <div className="board-page" style={{ background: isGradient ? bg : undefined }}>
      {/* BOARD HEADER */}
      <div className="board-header">
        <div className="board-header__left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Kthehu</button>
          <h1 className="board-header__title">{currentBoard.title}</h1>
          {currentBoard.isStarred && <span>⭐</span>}
        </div>
        <div className="board-header__right">
          <button className="btn btn-ghost btn-sm"
            onClick={() => boardsAPI.update(id, { isStarred: !currentBoard.isStarred })
              .then(r => setBoard({ ...currentBoard, isStarred: r.data.isStarred }))}>
            {currentBoard.isStarred ? '⭐' : '☆'} Yllo
          </button>
        </div>
      </div>

      {/* KANBAN */}
      <div className="kanban-board">
        <DndContext sensors={sensors} collisionDetection={closestCorners}
          onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {currentBoard.columns.map(col => (
            <KanbanColumn key={col._id} column={col}
              onAddCard={(colId) => setCardModal({ open: true, card: null, columnId: colId })}
              onEditColumn={() => {/* TODO: Edit column modal */}}
              onDeleteColumn={handleDeleteColumn}
              onEditCard={(card) => setCardModal({ open: true, card, columnId: card.column })}
              onDeleteCard={handleDeleteCard}
            />
          ))}

          <DragOverlay>
            {activeCard && <KanbanCard card={activeCard} onEdit={() => {}} onDelete={() => {}} />}
          </DragOverlay>
        </DndContext>

        {/* ADD COLUMN */}
        <div className="kanban-add-col">
          {addColInput ? (
            <form onSubmit={handleAddColumn} className="kanban-add-col__form">
              <input className="input" placeholder="Emri i kolonës" value={newColTitle} autoFocus
                onChange={e => setNewColTitle(e.target.value)} />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="submit" className="btn btn-primary btn-sm">Shto</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAddColInput(false)}>Anulo</button>
              </div>
            </form>
          ) : (
            <button className="kanban-add-col__btn" onClick={() => setAddColInput(true)}>
              + Shto kolonë
            </button>
          )}
        </div>
      </div>

      {cardModal.open && (
        <CardModal
          card={cardModal.card}
          columnId={cardModal.columnId}
          boardId={id}
          onClose={() => setCardModal({ open: false, card: null, columnId: null })}
          onSave={handleCardSave}
        />
      )}
    </div>
  );
}
