/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Card, CardTag } from "../types";
import { useStore } from "../store";
import { 
  X, 
  Trash2, 
  Calendar, 
  CheckSquare, 
  MessageSquare, 
  NotebookPen 
} from "lucide-react";

interface CardDetailModalProps {
  cardId: string;
  onClose: () => void;
}

const PRESET_TAGS: CardTag[] = [
  { id: "tag-f", text: "Feature", color: "bg-blue-600/30 text-blue-400 border-blue-500/50" },
  { id: "tag-b", text: "Backend", color: "bg-violet-600/30 text-violet-400 border-violet-500/50" },
  { id: "tag-ui", text: "UI/UX", color: "bg-fuchsia-600/30 text-fuchsia-400 border-fuchsia-500/50" },
  { id: "tag-doc", text: "Docs", color: "bg-emerald-600/30 text-emerald-400 border-emerald-500/50" },
  { id: "tag-bug", text: "Bug Fix", color: "bg-rose-600/30 text-rose-400 border-rose-500/50" }
];

export default function CardDetailModal({ cardId, onClose }: CardDetailModalProps) {
  const {
    cards,
    members,
    currentUser,
    updateCard,
    deleteCard,
    addComment,
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    addTag,
    removeTag,
    toggleAssignee,
    focusCard
  } = useStore();

  const card = cards[cardId];

  // Socket focus tracking
  useEffect(() => {
    focusCard(cardId);
    return () => {
      focusCard(null);
    };
  }, [cardId, focusCard]);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [newComment, setNewComment] = useState("");
  const [newCheckItem, setNewCheckItem] = useState("");
  const [isDescEditing, setIsDescEditing] = useState(false);

  // Sync state when details load
  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDesc(card.description);
    }
  }, [card]);

  if (!card) return null;

  const handleTitleBlur = () => {
    if (!title.trim()) {
      setTitle(card.title);
      return;
    }
    updateCard(card.id, { title: title.trim() });
  };

  const handleDescSave = () => {
    updateCard(card.id, { description: desc.trim() });
    setIsDescEditing(false);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addComment(card.id, newComment.trim());
    setNewComment("");
  };

  const handleChecklistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheckItem.trim()) return;
    addChecklistItem(card.id, newCheckItem.trim());
    setNewCheckItem("");
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to permanently delete this task? This action cannot be reversed.")) {
      deleteCard(card.id);
      onClose();
    }
  };

  // Extract collaborators actively focusing on this card
  const activeReviewers = Object.values(members).filter(
    (m) => m.isOnline && m.currentCardId === card.id && m.id !== currentUser?.id
  );

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div 
        id="card-detail-dialog" 
        className="bg-[#111111] border-2 border-white max-w-4xl w-full p-6 md:p-8 shadow-2xl relative flex flex-col md:flex-row gap-8 max-h-[90vh] overflow-y-auto rounded-none animate-in fade-in duration-100"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-white/10 text-white/50 hover:text-white rounded-none border border-white/10 transition"
          title="Close details"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left column: editing description, checklist and comments */}
        <div className="flex-1 space-y-6 md:max-h-[80vh] md:overflow-y-auto pr-1 custom-scrollbar">
          {/* Real-time Viewing Indicators banner */}
          {activeReviewers.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-600/10 border border-blue-500/50 rounded-none text-xs text-white">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <div className="flex items-center gap-1 font-bold uppercase tracking-wider text-[10px]">
                <span className="text-blue-400">Collaborators reading now:</span>
                <span className="text-white">
                  {activeReviewers.map((r) => r.avatar + " " + r.name).join(", ")}
                </span>
              </div>
            </div>
          )}

          {/* Title Area */}
          <div>
            <span className="text-[10px] uppercase font-black text-white/40 tracking-widest font-mono">
              Task Heading
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => e.key === "Enter" && handleTitleBlur()}
              className="text-lg md:text-xl font-black text-white border-b border-white/20 hover:border-white focus:border-white bg-[#1a1a1a] py-2 px-3 w-full focus:outline-none transition leading-tight tracking-wide uppercase mt-2 rounded-none"
            />
          </div>

          {/* Scope / Description Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black text-white/40 tracking-widest font-mono flex items-center gap-1.5">
                <NotebookPen className="w-3.5 h-3.5" />
                Description
              </span>
              {!isDescEditing && (
                <button
                  onClick={() => setIsDescEditing(true)}
                  className="text-[10px] font-black uppercase text-blue-400 hover:text-blue-300 tracking-wider"
                >
                  Edit Scope
                </button>
              )}
            </div>

            {isDescEditing ? (
              <div className="space-y-3">
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Define goals, steps, details of this task..."
                  rows={4}
                  className="w-full bg-[#1a1a1a] border border-white/20 rounded-none focus:outline-none focus:border-white text-sm text-white p-3 font-sans"
                />
                <div className="flex justify-end gap-2 text-xs">
                  <button
                    onClick={() => setIsDescEditing(false)}
                    className="px-3.5 py-1.5 font-bold uppercase tracking-wider text-white/50 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDescSave}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs rounded-none"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-black rounded-none border border-white/10 min-h-[80px]">
                {card.description ? (
                  <p className="text-xs text-white/80 uppercase font-semibold leading-relaxed whitespace-pre-wrap">{card.description}</p>
                ) : (
                  <p className="text-xs text-white/30 italic uppercase tracking-wider">// NO DESCRIPTION DEFINED YET.</p>
                )}
              </div>
            )}
          </div>

          {/* Subtasks Checklists */}
          <div className="space-y-3.5">
            <span className="text-[10px] uppercase font-black text-white/40 tracking-widest font-mono flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5" />
              Subtasks Checklist
            </span>

            {/* Checklist Items list */}
            {card.checklist.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {card.checklist.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 group/item bg-black p-2.5 border border-white/5">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs text-white select-none flex-1 font-bold uppercase tracking-wide">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => toggleChecklistItem(card.id, item.id)}
                        className="w-4 h-4 rounded-none text-blue-600 bg-zinc-900 border-white/20 focus:ring-0 cursor-pointer"
                      />
                      <span className={item.completed ? "line-through text-white/40" : ""}>
                        {item.text}
                      </span>
                    </label>
                    <button
                      onClick={() => deleteChecklistItem(card.id, item.id)}
                      className="p-1 opacity-0 group-hover/item:opacity-100 text-white/40 hover:text-rose-500 transition rounded-none"
                      title="Remove checklist item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Checklist Inline Add form */}
            <form onSubmit={handleChecklistSubmit} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Add checklist sub-task item..."
                value={newCheckItem}
                onChange={(e) => setNewCheckItem(e.target.value)}
                className="flex-1 bg-black text-white text-xs py-2 px-3 rounded-none border border-white/20 focus:outline-none focus:border-white placeholder-white/20 font-bold uppercase tracking-wide"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-white text-black hover:bg-white/80 text-[10px] uppercase font-black tracking-widest rounded-none transition"
              >
                Add Item
              </button>
            </form>
          </div>

          {/* Comment Threads */}
          <div className="space-y-4 pt-2">
            <span className="text-[10px] uppercase font-black text-white/40 tracking-widest font-mono flex items-center gap-1.5 border-b border-white/10 pb-2">
              <MessageSquare className="w-3.5 h-3.5" />
              Activity Comments ({card.comments?.length || 0})
            </span>

            {/* Comment Thread Stream */}
            {card.comments && card.comments.length > 0 && (
              <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {card.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-none bg-zinc-800 flex items-center justify-center text-xs flex-shrink-0 border border-white/15">
                      {comment.authorAvatar}
                    </div>
                    <div className="flex-1 bg-black p-3 rounded-none border border-white/10 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-white">{comment.authorName}</span>
                        <span className="text-[8px] text-white/40 font-mono">
                          {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-white/70 font-medium uppercase font-sans leading-relaxed">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Comment input form */}
            <form onSubmit={handleCommentSubmit} className="flex gap-3">
              <div className="w-8 h-8 rounded-none bg-blue-600 text-black font-black flex items-center justify-center text-sm flex-shrink-0 select-none">
                {currentUser?.avatar || "👤"}
              </div>
              <div className="flex-1 space-y-2">
                <textarea
                  required
                  placeholder="Type a team message or updates..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                  className="w-full bg-[#161616] border border-white/20 rounded-none focus:outline-none focus:border-white text-white p-2.5 text-xs font-bold uppercase tracking-wider resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-none transition"
                  >
                    Post Comment
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right column sidebar: configuration parameters */}
        <div className="w-full md:w-64 space-y-6 md:border-l md:border-white/10 md:pl-6 pt-4 md:pt-0">
          {/* Priority toggler */}
          <div className="space-y-2">
            <span className="block text-[10px] uppercase font-black text-white/40 tracking-widest font-mono">
              Task Priority
            </span>
            <div className="grid grid-cols-3 gap-1">
              {(["low", "medium", "high"] as const).map((p) => {
                const colors = {
                  low: "bg-zinc-800 text-white border-zinc-700 font-black",
                  medium: "bg-blue-600 text-white border-blue-500 font-black",
                  high: "bg-rose-600 text-white border-rose-500 font-black"
                };
                const active = card.priority === p;
                return (
                  <button
                    key={p}
                    onClick={() => updateCard(card.id, { priority: p })}
                    className={`text-[9px] py-1.5 border tracking-wider text-center transition font-mono uppercase rounded-none ${
                      active ? colors[p] : "text-white/40 border-white/10 hover:text-white"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assign Team Members stack */}
          <div className="space-y-2">
            <span className="block text-[10px] uppercase font-black text-white/40 tracking-widest font-mono">
              Assignees
            </span>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
              {Object.values(members).map((member) => {
                const isAssigned = card.assignees && card.assignees.includes(member.id);
                return (
                  <button
                    key={member.id}
                    onClick={() => toggleAssignee(card.id, member.id)}
                    className={`w-full flex items-center justify-between p-2 text-left rounded-none border transition ${
                      isAssigned 
                        ? "border-blue-500 bg-white/5 text-white" 
                        : "border-white/15 text-white/50 hover:border-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-none ${member.color} text-black font-extrabold flex items-center justify-center text-[10px]`}>
                        {member.avatar}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider truncate max-w-[120px]">
                        {member.name}
                      </span>
                    </div>
                    {isAssigned && (
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-none"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom tags/labels */}
          <div className="space-y-2">
            <span className="block text-[10px] uppercase font-black text-white/40 tracking-widest font-mono">
              Labels / Tags
            </span>
            
            {/* Active labels lists */}
            {card.tags && card.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2.5">
                {card.tags.map((t) => (
                  <span
                    key={t.id}
                    onClick={() => removeTag(card.id, t.id)}
                    className={`text-[8px] font-black px-1.5 py-0.5 border uppercase font-mono ${t.color} cursor-pointer hover:line-through rounded-none`}
                    title="Click to remove tag"
                  >
                    {t.text}
                  </span>
                ))}
              </div>
            )}

            {/* Presets to apply */}
            <div className="space-y-1.5">
              <span className="block text-[8px] font-black uppercase text-white/30 tracking-widest">// PRESETS:</span>
              <div className="flex flex-wrap gap-1">
                {PRESET_TAGS.map((tag) => {
                  const alreadyApplied = card.tags && card.tags.some((t) => t.id === tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => !alreadyApplied && addTag(card.id, tag)}
                      disabled={alreadyApplied}
                      className={`text-[8px] px-1.5 py-0.5 border font-mono rounded-none uppercase transition ${
                        alreadyApplied 
                          ? "bg-zinc-900 text-white/10 border-transparent cursor-not-allowed" 
                          : `${tag.color} hover:scale-105 hover:border-white`
                      }`}
                    >
                      {tag.text}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Due dates triggers */}
          <div className="space-y-2">
            <span className="block text-[10px] uppercase font-black text-white/40 tracking-widest font-mono flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Due Date
            </span>
            <input
              type="date"
              value={card.dueDate || ""}
              onChange={(e) => updateCard(card.id, { dueDate: e.target.value })}
              className="w-full bg-[#1a1a1a] text-white text-xs py-2 px-3 border border-white/20 rounded-none focus:outline-none focus:border-white font-bold"
            />
          </div>

          {/* Action and deletion buttons */}
          <div className="space-y-2 pt-4 border-t border-white/10">
            <button
              onClick={handleDelete}
              className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-white/20 hover:border-rose-500 hover:bg-rose-600/10 text-white/50 hover:text-white rounded-none text-xs font-black uppercase tracking-wider transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
