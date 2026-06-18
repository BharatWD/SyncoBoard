/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useStore } from "../store";
import { 
  Plus, 
  Trash2, 
  Settings, 
  Users, 
  UserPlus,
  Activity, 
  Check, 
  Layers, 
  Wifi, 
  WifiOff, 
  NotebookPen,
  BarChart2,
  Sun,
  Moon
} from "lucide-react";
import BoardInsights from "./BoardInsights";
import InviteModal from "./InviteModal";

export default function BoardHeader() {
  const {
    boards,
    activeBoardId,
    members,
    logs,
    isSocketConnected,
    addBoard,
    setActiveBoard,
    deleteBoard,
    updateBoard,
    currentUser,
    theme,
    setTheme
  } = useStore();

  const [isNewBoardOpen, setIsNewBoardOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDesc, setNewBoardDesc] = useState("");

  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const activeBoard = activeBoardId ? boards[activeBoardId] : null;

  const handleCreateBoard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;
    addBoard(newBoardName.trim(), newBoardDesc.trim());
    setNewBoardName("");
    setNewBoardDesc("");
    setIsNewBoardOpen(false);
  };

  const handleOpenSettings = () => {
    if (!activeBoard) return;
    setEditName(activeBoard.name);
    setEditDesc(activeBoard.description);
    setIsSettingsOpen(true);
  };

  const handleSaveSettings = () => {
    if (!activeBoard || !editName.trim()) return;
    updateBoard(activeBoard.id, editName.trim(), editDesc.trim());
    setIsSettingsOpen(false);
  };

  const handleDeleteActive = () => {
    if (!activeBoard) return;
    if (confirm("Are you sure you want to delete this board and all its columns?")) {
      deleteBoard(activeBoard.id);
      setIsSettingsOpen(false);
    }
  };

  // Extract online users
  const onlineMembers = Object.values(members).filter((m) => m.isOnline);

  return (
    <header className="border-b border-white/10 bg-black text-white px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none relative">
      {/* Brand & Board Selector */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white font-black italic w-9 h-9 flex items-center justify-center text-lg">
            S
          </div>
          <span className="font-sans font-black tracking-tighter text-xl uppercase">
            SYNCO.BOARD
          </span>
        </div>

        <div className="h-4 w-px bg-white/20 hidden sm:block"></div>

        {/* Board Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={activeBoardId || ""}
            onChange={(e) => setActiveBoard(e.target.value)}
            className="px-3 py-1.5 bg-zinc-900 border border-white/20 text-white text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-white rounded-none max-w-[200px]"
          >
            {Object.values(boards).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name.toUpperCase()}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsNewBoardOpen(true)}
            className="p-1.5 hover:bg-white/10 text-white border border-white/10 hover:border-white/30 transition rounded-none"
            title="Create New Board"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sync Status, Team Presence & Activity logs */}
      <div className="flex items-center gap-6 justify-between md:justify-end">
        {/* Network Sync status */}
        <div className="flex items-center gap-1.5" title={isSocketConnected ? "Synced with Express WS Server" : "Reconnecting state..."}>
          {isSocketConnected ? (
            <div className="flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-sans font-black text-emerald-400 uppercase tracking-widest hidden sm:inline">
                LIVE_SYNC
              </span>
              <Wifi className="w-3.5 h-3.5 text-emerald-400 sm:hidden" />
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 animate-pulse"></span>
              </span>
              <span className="text-[10px] font-sans font-black text-rose-500 uppercase tracking-widest hidden sm:inline">
                OFFLINE
              </span>
              <WifiOff className="w-3.5 h-3.5 text-rose-500 sm:hidden" />
            </div>
          )}
        </div>

        {/* Member Facepile presence list */}
        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-1.5 overflow-hidden py-1">
            {onlineMembers.map((member) => (
              <div
                key={member.id}
                className={`w-7 h-7 rounded-none ${member.color} text-black border border-black font-black flex items-center justify-center text-xs relative transition-transform hover:scale-110 cursor-pointer`}
                title={`${member.name} (${member.isOnline ? "Online" : "Away"}) ${member.id === currentUser?.id ? "(You)" : ""}`}
              >
                {member.avatar}
                <span className="absolute bottom-0 right-0 block h-1.5 w-1.5 rounded-full bg-emerald-400 ring-1 ring-black"></span>
              </div>
            ))}
          </div>
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider hidden md:inline">
            // {onlineMembers.length} ACTIVE
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-none border border-white/10 transition flex items-center justify-center"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-white" />}
          </button>

          {activeBoard && (
            <button
              onClick={handleOpenSettings}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-none border border-white/10 transition"
              title="Board Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => {
              setIsActivityOpen(!isActivityOpen);
              setIsInsightsOpen(false);
              setIsInviteOpen(false);
            }}
            className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider border rounded-none transition flex items-center gap-2 ${
              isActivityOpen 
                ? "bg-white text-black border-white" 
                : "bg-black text-white border-white/20 hover:border-white"
            }`}
            title="Activity Logs"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Logs</span>
          </button>

          <button
            onClick={() => {
              setIsInsightsOpen(!isInsightsOpen);
              setIsActivityOpen(false);
              setIsInviteOpen(false);
            }}
            className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider border rounded-none transition flex items-center gap-2 ${
              isInsightsOpen 
                ? "bg-white text-black border-white" 
                : "bg-black text-white border-white/20 hover:border-white"
            }`}
            title="Board Insights"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Insights</span>
          </button>

          {activeBoard && (
            <button
              onClick={() => {
                setIsInviteOpen(!isInviteOpen);
                setIsActivityOpen(false);
                setIsInsightsOpen(false);
              }}
              className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider border rounded-none transition flex items-center gap-2 ${
                isInviteOpen 
                  ? "bg-white text-black border-white" 
                  : "bg-black text-white border-white/20 hover:border-white"
              }`}
              title="Invite Members"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite</span>
            </button>
          )}
        </div>
      </div>

      {/* Board descriptions banner */}
      {activeBoard && activeBoard.description && (
        <div className="absolute top-full left-0 right-0 bg-[#0c0c0c] border-b border-white/10 px-6 py-2.5 text-[10px] text-white/50 tracking-wide flex items-center gap-2 z-10 font-bold uppercase">
          <span className="text-blue-500 font-extrabold">// SCOPE:</span>
          <span>{activeBoard.description}</span>
        </div>
      )}

      {/* New Board Modal */}
      {isNewBoardOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border-2 border-white text-white rounded-none max-w-md w-full p-8 animate-in fade-in duration-100">
            <h3 className="text-lg font-black uppercase tracking-tighter mb-6 border-b border-white/10 pb-3">// CREATE NEW BOARD</h3>
            <form onSubmit={handleCreateBoard} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                  Board Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SPRINT PIPELINE"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-white/20 rounded-none focus:outline-none focus:border-white text-sm text-white placeholder-white/30 uppercase tracking-wider font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                  Objective / Goals
                </label>
                <textarea
                  placeholder="Define milestones..."
                  value={newBoardDesc}
                  onChange={(e) => setNewBoardDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-white/20 rounded-none focus:outline-none focus:border-white text-sm text-white placeholder-white/30 resize-none font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsNewBoardOpen(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/50 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 font-black text-xs uppercase tracking-widest text-white shadow-lg transition"
                >
                  Confirm Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Board Settings Modal */}
      {isSettingsOpen && activeBoard && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border-2 border-white text-white rounded-none max-w-md w-full p-8 animate-in fade-in duration-100">
            <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-3">
              <h3 className="text-lg font-black uppercase tracking-tighter">// CONFIGURE BOARD</h3>
              <button
                onClick={handleDeleteActive}
                className="p-1.5 text-white/50 hover:text-rose-500 hover:bg-white/5 transition"
                title="Delete Current Board"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                  Update Title
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-white/20 rounded-none focus:outline-none focus:border-white text-sm text-white uppercase tracking-wider font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                  Update Description
                </label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-white/20 rounded-none focus:outline-none focus:border-white text-sm text-white resize-none font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/50 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 font-black text-xs uppercase tracking-widest text-white transition"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Activity Logs Drawer */}
      {isActivityOpen && (
        <div className="fixed inset-y-0 right-0 w-80 bg-[#0f0f0f] border-l border-white/10 shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-200">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black">
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-white">Collaboration Log</h3>
            </div>
            <button
              onClick={() => setIsActivityOpen(false)}
              className="text-[10px] font-black uppercase tracking-wider text-white/40 hover:text-white border border-white/10 px-2 py-1"
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {logs.length === 0 ? (
              <p className="text-xs text-white/40 text-center py-6 font-bold uppercase tracking-wider">// NO ACTIVITY YET</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-3 bg-white/5 rounded-none border border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 justify-between">
                    <span className="text-xs font-black uppercase tracking-tight text-white">{log.userName}</span>
                    <span className="text-[9px] bg-white/10 text-white/60 px-1.5 py-0.5 rounded-none uppercase font-mono font-black">
                      {log.targetType}
                    </span>
                  </div>
                  <p className="text-xs text-white/70">
                    {log.action} <span className="font-extrabold text-blue-400">"{log.targetName}"</span>
                  </p>
                  <p className="text-[9px] text-white/40 font-mono text-right">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Collapsible Board Insights Panel (D3 Rendered) */}
      {isInsightsOpen && (
        <BoardInsights onClose={() => setIsInsightsOpen(false)} />
      )}

      {/* Popover Invite Members Modal */}
      {isInviteOpen && (
        <InviteModal onClose={() => setIsInviteOpen(false)} />
      )}
    </header>
  );
}
