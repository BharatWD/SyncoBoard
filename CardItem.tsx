/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Card } from "../types";
import { useStore } from "../store";
import { 
  Calendar, 
  CheckSquare, 
  MessageSquare, 
  Eye 
} from "lucide-react";

interface CardItemProps {
  key?: React.Key | string;
  card: Card;
  index: number;
  onSelect: () => void;
}

export default function CardItem({ card, index, onSelect }: CardItemProps) {
  const { members, currentUser, emitLiveDrag, moveCard } = useStore();
  const [dropIndicator, setDropIndicator] = useState<"top" | "bottom" | null>(null);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", card.id);
    e.dataTransfer.setData("text/source-col", card.columnId);
    e.dataTransfer.effectAllowed = "move";
    
    // Add transparent/semi-invisible ghost image style
    setTimeout(() => {
      const el = document.getElementById(`card-ref-${card.id}`);
      if (el) el.style.opacity = "0.4";
    }, 0);

    emitLiveDrag(card.id, card.columnId, index);
  };

  const handleDragEnd = () => {
    const el = document.getElementById(`card-ref-${card.id}`);
    if (el) el.style.opacity = "1";
    setDropIndicator(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const isTopHalf = relativeY < rect.height / 2;

    setDropIndicator(isTopHalf ? "top" : "bottom");
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragLeave = () => {
    setDropIndicator(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const indicator = dropIndicator;
    setDropIndicator(null);

    const draggedCardId = e.dataTransfer.getData("text/plain");
    const sourceColId = e.dataTransfer.getData("text/source-col");

    if (!draggedCardId) return;

    // Calculate target index
    let targetIdx = index;
    if (indicator === "bottom") {
      targetIdx = index + 1;
    }

    moveCard(draggedCardId, sourceColId, card.columnId, targetIdx);
  };

  // Check if check list has active indicators
  const totalCheck = card.checklist.length;
  const completedCheck = card.checklist.filter((c) => c.completed).length;

  // Check if any other user is currently focused or viewing/editing this card!
  const viewingMembers = Object.values(members).filter(
    (member) => member.isOnline && member.currentCardId === card.id && member.id !== currentUser?.id
  );

  // Render priority tags
  const priorityClasses = {
    low: "bg-zinc-800 text-white border-zinc-700",
    medium: "bg-blue-600 text-white border-blue-500",
    high: "bg-rose-600 text-white border-rose-500"
  };

  return (
    <div
      id={`card-ref-${card.id}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={onSelect}
      className={`group bg-black rounded-none border p-4 hover:border-white cursor-grab active:cursor-grabbing transition duration-100 relative overflow-hidden ${
        dropIndicator ? "border-blue-500/55 bg-blue-950/5" : "border-white/10"
      }`}
    >
      {/* Drop indicators */}
      {dropIndicator === "top" && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 z-30 pointer-events-none animate-pulse" />
      )}
      {dropIndicator === "bottom" && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 z-30 pointer-events-none animate-pulse" />
      )}
      {/* Label and priority line */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <div className="flex flex-wrap gap-1 max-w-[70%]">
          {card.tags && card.tags.slice(0, 2).map((t) => (
            <span
              key={t.id}
              className={`text-[8px] font-black px-1.5 py-0.5 rounded-none uppercase border font-mono ${t.color}`}
            >
              {t.text}
            </span>
          ))}
        </div>

        {card.priority && (
          <span className={`text-[8px] uppercase tracking-widest font-mono px-1.5 py-0.5 border font-black ${priorityClasses[card.priority]}`}>
            {card.priority}
          </span>
        )}
      </div>

      {/* Task Heading */}
      <h4 className="text-xs font-black text-white group-hover:text-blue-400 uppercase tracking-wide leading-tight transition duration-100">
        {card.title}
      </h4>

      {/* Short Description excerpt */}
      {card.description && (
        <p className="text-[11px] text-white/50 mt-1 lines-clamp-2 uppercase font-medium">
          {card.description}
        </p>
      )}

      {/* Checklist Completion meter if check items exist */}
      {totalCheck > 0 && (
        <div className="mt-3.5 space-y-1">
          <div className="flex items-center justify-between text-[8px] text-white/40 font-black font-mono uppercase tracking-widest">
            <span className="flex items-center gap-1">
              <CheckSquare className="w-3 h-3 text-white/40" />
              <span>SUBTASKS</span>
            </span>
            <span>{completedCheck}/{totalCheck}</span>
          </div>
          {/* Custom progress bar */}
          <div className="w-full bg-zinc-900 rounded-none h-1.5 border border-white/5">
            <div 
              className="bg-blue-600 h-1 rounded-none transition-all duration-300"
              style={{ width: `${(completedCheck / totalCheck) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Card Details Footer metadata */}
      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-white/10">
        <div className="flex items-center gap-3">
          {/* Comments count */}
          {card.comments && card.comments.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[9px] font-black text-white/40 font-mono">
              <MessageSquare className="w-3 h-3" />
              <span>{card.comments.length}</span>
            </span>
          )}

          {/* Due date badge if exists */}
          {card.dueDate && (
            <span className="inline-flex items-center gap-1 text-[8px] font-black text-white/50 font-mono bg-[#111111] px-1.5 py-0.5 border border-white/10 rounded-none uppercase">
              <Calendar className="w-3 h-3" />
              <span>{card.dueDate}</span>
            </span>
          )}
        </div>

        {/* Board Assignees stack */}
        <div className="flex items-center animate-in fade-in">
          <div className="flex -space-x-1 overflow-hidden">
            {card.assignees && card.assignees.map((id) => {
              const assignee = members[id];
              if (!assignee) return null;
              return (
                <div
                  key={id}
                  className={`w-5 h-5 rounded-none ${assignee.color} text-black font-extrabold flex items-center justify-center text-[10px] border border-black`}
                  title={assignee.name}
                >
                  {assignee.avatar}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Online presence viewing status layer */}
      {viewingMembers.length > 0 && (
        <div className="absolute top-1 right-1 flex items-center gap-1 px-1.5 py-0.5 bg-blue-600/20 border border-blue-500 scale-[0.8] rounded-none">
          <Eye className="w-2.5 h-2.5 text-blue-400 animate-pulse" />
          <div className="flex -space-x-1">
            {viewingMembers.map((m) => (
              <span key={m.id} title={`${m.name} is reading this task`} className="text-[10px]">
                {m.avatar}
              </span>
            ))}
          </div>
          <span className="text-[7px] font-black text-blue-400 uppercase font-mono tracking-widest ml-1">
            ACTIVE
          </span>
        </div>
      )}
    </div>
  );
}
