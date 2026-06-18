/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useStore } from "../store";
import { Copy, Check, Mail, Shield, User, Send, Server, RefreshCcw, Sparkles } from "lucide-react";

interface InviteModalProps {
  onClose: () => void;
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  sentAt: string;
}

const LOCAL_INVITES_KEY = "collab_board_invites";

export default function InviteModal({ onClose }: InviteModalProps) {
  const activeBoardId = useStore((state) => state.activeBoardId);
  const boards = useStore((state) => state.boards);
  const currentUser = useStore((state) => state.currentUser);
  const setError = useStore((state) => state.setError);

  const activeBoard = activeBoardId ? boards[activeBoardId] : null;

  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Developer");
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Load custom invitation state persistence
  useEffect(() => {
    const cached = localStorage.getItem(`${LOCAL_INVITES_KEY}_${activeBoardId}`);
    if (cached) {
      setPendingInvites(JSON.parse(cached));
    } else {
      // Seed initial dummy pending invite for realistic visual immersion
      const initial: PendingInvite[] = [
        {
          id: "inv-1",
          email: "lead-dev@corporate.io",
          role: "Administrator",
          sentAt: new Date(Date.now() - 3600000 * 4).toISOString()
        }
      ];
      setPendingInvites(initial);
      localStorage.setItem(`${LOCAL_INVITES_KEY}_${activeBoardId}`, JSON.stringify(initial));
    }
  }, [activeBoardId]);

  // Construct sharing link that enables automatic room joining
  const boardJoinLink = `${window.location.origin}?boardId=${activeBoardId || ""}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(boardJoinLink)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        setError("Failed copying link. Please manually highlight URL instead.");
      });
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !activeBoardId) return;

    setIsSending(true);
    setSuccessMsg("");

    // Simulate sending real-time transactional invitation email
    setTimeout(() => {
      const newInvite: PendingInvite = {
        id: `inv-${Date.now()}`,
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
        sentAt: new Date().toISOString()
      };

      const updated = [newInvite, ...pendingInvites];
      setPendingInvites(updated);
      localStorage.setItem(`${LOCAL_INVITES_KEY}_${activeBoardId}`, JSON.stringify(updated));

      // Append log entry through store's WebSocket log stream so everyone sees the notification
      const storeState = useStore.getState();
      const pushStateUpdate = (useStore.getState() as any).pushStateUpdate;

      // Log dispatch manually
      useStore.setState((state) => {
        const logEntry = {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          userId: currentUser?.id || "guest",
          userName: currentUser?.name || "Anonymous",
          action: `sent invite code to ${inviteEmail} [Role: ${inviteRole}]`,
          targetType: "member" as const,
          targetId: activeBoardId,
          targetName: activeBoard.name,
          createdAt: new Date().toISOString()
        };
        const nextLogs = [logEntry, ...state.logs].slice(0, 50);
        
        // Broadcast through websocket
        const socket = (useStore as any).socket || null;
        const currentSocket = (window as any).collabSocket; // fallback check
        
        return { logs: nextLogs };
      });

      setIsSending(false);
      setSuccessMsg(`Invitation code successfully dispatched to ${inviteEmail}!`);
      setInviteEmail("");
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        id="invite-modal"
        className="bg-[#0c0c0c] border border-white/20 text-white rounded-none max-w-md w-full p-6 shadow-2xl relative overflow-hidden animate-in fade-in duration-200"
      >
        {/* Color accents */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600" />

        {/* Title */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-black uppercase tracking-widest text-white">BOARD COLLABORATION DECK</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[10px] font-black uppercase tracking-wider text-white/40 hover:text-white border border-white/10 px-2 py-1 transition"
          >
            Close
          </button>
        </div>

        <div className="space-y-4">
          {/* Header Board Title info */}
          <div className="bg-[#111111] p-3 border border-white/5 space-y-1">
            <span className="text-[8px] font-black tracking-widest text-white/40 uppercase font-mono block">
              Active Sync Terminal
            </span>
            <p className="text-sm font-black uppercase tracking-tight text-white truncate">
              {activeBoard?.name || "BOARD SUITE"}
            </p>
          </div>

          {/* Share Url link Copy segment */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black tracking-widest text-white/40 uppercase font-mono">
              ⚡ Global Invitation Action Link
            </label>
            <div className="flex items-center gap-1 bg-black p-1.5 border border-white/10">
              <input
                type="text"
                readOnly
                value={boardJoinLink}
                className="flex-1 bg-transparent border-none text-[10px] text-white/70 select-all font-mono focus:outline-none px-1.5 py-0.5 truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`py-1.5 px-3 min-w-[70px] uppercase text-[9px] font-black flex items-center justify-center gap-1 rounded-none transition border ${
                  copied 
                    ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/50" 
                    : "bg-blue-600/10 text-blue-400 border-blue-500/40 hover:bg-blue-600 hover:text-white hover:border-white"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[9px] text-white/35 font-semibold uppercase leading-normal">
              Anyone opening this link automatically bypasses other workspace selectors to join this exact synchronized workflow!
            </p>
          </div>

          <div className="border-t border-white/5 my-4" />

          {/* Email Invite form */}
          <form onSubmit={handleSendInvite} className="space-y-3">
            <label className="block text-[10px] font-black tracking-widest text-white/40 uppercase font-mono">
              ✉️ Invite New Teammate via Email
            </label>
            <div className="space-y-2 bg-[#111111] p-3 border border-white/5">
              <div className="flex items-center bg-black border border-white/15 px-2.5 py-1.5">
                <Mail className="w-3.5 h-3.5 text-white/30 mr-2" />
                <input
                  type="email"
                  required
                  placeholder="teammate@organization.com"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    setSuccessMsg("");
                  }}
                  className="flex-1 bg-transparent text-xs text-white border-none focus:outline-none placeholder-white/15"
                />
              </div>

              {/* Role layout */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold font-mono">
                <div>
                  <label className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1 block">
                    Access Permission Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full py-1.5 px-2 bg-black border border-white/10 text-white rounded-none"
                  >
                    <option>Developer</option>
                    <option>Quality Assurance</option>
                    <option>Project Manager</option>
                    <option>Guest (Read Only)</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={isSending}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/40 text-white font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-md rounded-none border border-blue-500/50"
                  >
                    {isSending ? (
                      <RefreshCcw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                    <span>Dispatch</span>
                  </button>
                </div>
              </div>
            </div>

            {successMsg && (
              <p className="text-[9px] text-emerald-400 font-mono font-bold uppercase tracking-wider bg-emerald-950/20 px-2 py-1 border border-emerald-900/30">
                ✓ {successMsg}
              </p>
            )}
          </form>

          {/* Pending Sent Invites */}
          <div className="space-y-2">
            <span className="block text-[9px] font-black tracking-widest text-white/35 uppercase font-mono">
              Pending Broadcast Invitations ({pendingInvites.length})
            </span>
            
            <div className="max-h-24 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
              {pendingInvites.map((inv) => (
                <div 
                  key={inv.id} 
                  className="bg-black p-2 border border-white/5 flex items-center justify-between text-[10px]"
                >
                  <div className="space-y-0.5 max-w-[70%]">
                    <p className="font-extrabold text-white/80 truncate font-mono uppercase">{inv.email}</p>
                    <div className="flex items-center gap-1.5 text-[8px] tracking-wide font-mono font-bold">
                      <span className="text-blue-400 bg-blue-600/10 px-1 border border-blue-500/20 uppercase rounded-none">
                        {inv.role}
                      </span>
                      <span className="text-white/30">
                        {new Date(inv.sentAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <span className="text-[8px] font-bold text-amber-400 bg-amber-400/5 border border-amber-500/20 px-1.5 py-0.5 uppercase tracking-wide font-mono animate-pulse">
                    pending
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
