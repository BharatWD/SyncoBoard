/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { useStore } from "./store";
import BoardHeader from "./components/BoardHeader";
import ColumnContainer from "./components/ColumnContainer";
import CardDetailModal from "./components/CardDetailModal";
import WelcomeModal from "./components/WelcomeModal";
import { Plus, Kanban } from "lucide-react";

export default function App() {
  const {
    init,
    boards,
    columns,
    cards,
    activeBoardId,
    currentUser,
    addColumn,
    error,
    setError
  } = useStore();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isAddingColumn, setIsAddingColumn] = useState(false);

  // Initialize Socket connection + rest fetches on startup
  useEffect(() => {
    init();
  }, [init]);

  const activeBoard = activeBoardId ? boards[activeBoardId] : null;

  const handleAddColumnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;
    addColumn(newColumnTitle.trim());
    setNewColumnTitle("");
    setIsAddingColumn(false);
  };

  // If user hasn't registered their collaboration name, require entrance profile setup first
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-sans">
        <WelcomeModal />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans transition-colors duration-150">
      {/* Collaborative Navigation Area */}
      <BoardHeader />

      {/* Main Board Content Layout */}
      {error && (
        <div className="bg-amber-600 text-white font-black text-xs px-6 py-3 flex items-center justify-between shadow-inner select-none uppercase tracking-wider border-b border-black">
          <span>// WARNING: {error}</span>
          <button 
            onClick={() => setError(null)} 
            className="text-[10px] font-black uppercase tracking-widest hover:bg-white/10 px-2 py-1 rounded-none border border-white"
          >
            DISMISS
          </button>
        </div>
      )}

      {activeBoard ? (
        <main className="flex-1 p-6 md:p-8 overflow-hidden flex flex-col relative">
          {/* Scrollable Column Boards horizontal lane */}
          <div className="flex-1 overflow-x-auto flex items-start gap-6 pb-5 pt-3 snap-x custom-scrollbar">
            {activeBoard.columnIds && activeBoard.columnIds.map((colId) => {
              const column = columns[colId];
              if (!column) return null;

              // Filter out archived tasks, only show current board cards matching this column
              const columnCards = column.cardIds
                .map((cid) => cards[cid])
                .filter((card) => card && !card.isArchived);

              return (
                <div key={colId} className="snap-center">
                  <ColumnContainer
                    column={column}
                    cards={columnCards}
                    onSelectCard={(id) => setSelectedCardId(id)}
                  />
                </div>
              );
            })}

            {/* Inline create column button */}
            <div className="w-80 flex-shrink-0 snap-center">
              {isAddingColumn ? (
                <form 
                  onSubmit={handleAddColumnSubmit}
                  className="bg-[#111111] p-5 rounded-none border border-white/20 space-y-4 animate-in fade-in duration-100"
                >
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest font-mono">
                    Column ID Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. READY FOR QA"
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-white/20 rounded-none focus:outline-none focus:border-white text-sm text-white font-bold uppercase tracking-wide"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingColumn(false)}
                      className="px-3 py-1.5 text-white/50 hover:text-white font-bold uppercase tracking-wider text-[10px]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider text-[10px] rounded-none"
                    >
                      Add Column
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingColumn(true)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 border border-dashed border-white/10 hover:border-white hover:bg-white/5 text-white/40 hover:text-white rounded-none text-xs font-black uppercase tracking-widest transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Column List
                </button>
              )}
            </div>
          </div>
        </main>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
          <div className="bg-white/5 text-white/40 border border-white/10 p-4 mb-4 rounded-none">
            <Kanban className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest">// NO ACTIVE BOARDS</h3>
          <p className="text-xs text-white/40 max-w-sm mt-2 uppercase font-semibold leading-relaxed">
            Create or select a workspace board from the dropdown selection above to start real-time task sync!
          </p>
        </div>
      )}

      {/* Task Description & Checklists details drawer */}
      {selectedCardId && (
        <CardDetailModal
          cardId={selectedCardId}
          onClose={() => setSelectedCardId(null)}
        />
      )}
    </div>
  );
}
