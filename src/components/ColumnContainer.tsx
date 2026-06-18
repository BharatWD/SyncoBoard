/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Column, Card } from "../types";
import { useStore } from "../store";
import CardItem from "./CardItem";
import { 
  Plus, 
  X, 
  Trash2, 
  Check, 
  Inbox 
} from "lucide-react";

interface ColumnContainerProps {
  column: Column;
  cards: Card[];
  onSelectCard: (cardId: string) => void;
}

export default function ColumnContainer({ column, cards, onSelectCard }: ColumnContainerProps) {
  const { moveCard, addCard, deleteColumn, renameColumn } = useStore();
  const [isDragOver, setIsDragOver] = useState(false);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameTitle, setRenameTitle] = useState(column.title);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const cardId = e.dataTransfer.getData("text/plain");
    const sourceColId = e.dataTransfer.getData("text/source-col");
    
    if (!cardId) return;

    // Move card to the list's tail
    moveCard(cardId, sourceColId, column.id, column.cardIds.length);
  };

  const handleAddCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    addCard(column.id, newTitle.trim(), { priority });
    setNewTitle("");
    setPriority("medium");
    setIsAdding(false);
  };

  const handleRenameSubmit = () => {
    if (!renameTitle.trim()) {
      setRenameTitle(column.title);
      setIsRenaming(false);
      return;
    }
    renameColumn(column.id, renameTitle.trim());
    setIsRenaming(false);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete the list "${column.title}"?`)) {
      deleteColumn(column.id);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-80 flex-shrink-0 flex flex-col bg-zinc-950 border p-4 max-h-[80vh] transition-all duration-150 rounded-none ${
        isDragOver 
          ? "border-blue-500 bg-white/5 active:scale-[1.005]" 
          : "border-white/10"
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 select-none">
        {isRenaming ? (
          <div className="flex items-center gap-1.5 w-[75%]">
            <input
              type="text"
              value={renameTitle}
              onChange={(e) => setRenameTitle(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
              autoFocus
              className="w-full bg-black border border-white/35 py-1 px-2 text-white font-bold text-xs uppercase tracking-wider rounded-none focus:outline-none focus:border-white"
            />
            <button 
              onMouseDown={handleRenameSubmit}
              className="p-1 hover:bg-white/10 text-emerald-400 rounded-none"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <h3 
            onClick={() => setIsRenaming(true)}
            className="text-xs font-black text-white tracking-widest uppercase cursor-pointer hover:bg-white/5 py-1 px-1.5 w-[75%] truncate"
            title="Click to rename list"
          >
            {column.title.toUpperCase()}
            <span className="text-[10px] text-white/40 font-mono ml-2 font-black">
              [{cards.length}]
            </span>
          </h3>
        )}

        <button
          onClick={handleDelete}
          className="p-1.5 text-white/40 hover:text-rose-500 hover:bg-white/5 rounded-none transition"
          title="Delete list"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Cards stack */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1 custom-scrollbar min-h-[100px]">
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-white/20 pointer-events-none border border-dashed border-white/5 rounded-none">
            <Inbox className="w-6 h-6 stroke-[1.5] mb-1.5" />
            <span className="text-[10px] font-black uppercase tracking-wider">// EMPTY LIST</span>
          </div>
        ) : (
          cards.map((card, idx) => (
            <CardItem
              key={card.id}
              card={card}
              index={idx}
              onSelect={() => onSelectCard(card.id)}
            />
          ))
        )}
      </div>

      {/* Add Task Control or Form */}
      <div className="mt-4 pt-4 border-t border-white/10">
        {isAdding ? (
          <form onSubmit={handleAddCardSubmit} className="space-y-3 bg-[#111111] p-3 rounded-none border border-white/20 animate-in fade-in duration-100">
            <input
              type="text"
              required
              placeholder="What needs to be done?"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-black text-white text-xs py-2 px-3 rounded-none border border-white/20 focus:outline-none focus:border-white placeholder-white/30 uppercase tracking-wide font-bold"
              autoFocus
            />

            <div className="flex items-center justify-between gap-1">
              {/* Priority Selectors */}
              <div className="flex items-center gap-1">
                <span className="text-[9px] uppercase font-mono font-black text-white/40 mr-1">PRI:</span>
                {(["low", "medium", "high"] as const).map((p) => {
                  const colors = {
                    low: "bg-zinc-800 text-white border-zinc-700",
                    medium: "bg-blue-600/20 text-blue-400 border-blue-500/50",
                    high: "bg-rose-600/20 text-rose-400 border-rose-500/50"
                  };
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`text-[8px] px-1.5 py-0.5 rounded-none font-mono font-black border uppercase transition ${
                        priority === p ? `${colors[p]} border-white scale-105` : "text-white/40 border-transparent hover:text-white/70"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="p-1 px-1.5 text-xs text-white/50 hover:text-white rounded-none hover:bg-white/5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-none text-[10px] font-black uppercase tracking-wider"
                >
                  Add
                </button>
              </div>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-white/10 hover:border-white hover:bg-white/5 text-white/40 hover:text-white rounded-none text-xs font-black uppercase tracking-wider transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Task
          </button>
        )}
      </div>
    </div>
  );
}
