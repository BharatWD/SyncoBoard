/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useStore } from "../store";
import { Sparkles, Users, Lock, Unlock, HelpCircle, Terminal, AlertTriangle, RefreshCw } from "lucide-react";

const AVATARS = ["👩‍💻", "🧔", "🧑‍🎨", "👩‍🚀", "🦊", "🐯", "🐼", "🧙‍♂️", "👩‍⚕️", "🦁"];
const COLORS = [
  "bg-blue-600",
  "bg-rose-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-fuchsia-600",
  "bg-violet-600",
  "bg-sky-600"
];

export default function WelcomeModal() {
  const joinBoard = useStore((state) => state.joinBoard);
  const members = useStore((state) => state.members);

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [errorMsg, setErrorMsg] = useState("");

  // Create password configuration
  const [isSecuring, setIsSecuring] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordHint, setNewPasswordHint] = useState("");

  // Verification
  const [enteredPassword, setEnteredPassword] = useState("");
  const [isForgotMode, setIsForgotMode] = useState(false);

  // Rescue simulation
  const [countdown, setCountdown] = useState<number | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [countdownTimer, setCountdownTimer] = useState<any>(null);

  // Match existing registered member as they type
  const activeMatchedMember = Object.values(members).find(
    (m) => m.name.trim().toLowerCase() === name.trim().toLowerCase()
  );

  const hasPassword = !!(activeMatchedMember && activeMatchedMember.password);

  // Sync avatar and color previews if matching a non-locked existing user
  useEffect(() => {
    if (activeMatchedMember && !isForgotMode && countdown === null) {
      setAvatar(activeMatchedMember.avatar);
      setSelectedColor(activeMatchedMember.color);
    }
  }, [name, activeMatchedMember, isForgotMode, countdown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Please enter a valid handle to access the workspace.");
      return;
    }

    // Checking returning locked user
    if (activeMatchedMember) {
      if (hasPassword) {
        if (enteredPassword !== activeMatchedMember.password) {
          setErrorMsg("Access Denied: Incorrect passcode.");
          return;
        }
        // Success login
        joinBoard(
          activeMatchedMember.name,
          activeMatchedMember.avatar,
          activeMatchedMember.color,
          activeMatchedMember.password,
          activeMatchedMember.passwordHint
        );
        return;
      } else {
        // Welcoming unlocked user back
        joinBoard(
          activeMatchedMember.name,
          activeMatchedMember.avatar,
          activeMatchedMember.color,
          newPassword || undefined,
          newPasswordHint || undefined
        );
        return;
      }
    }

    // Creating fresh profile
    joinBoard(
      name.trim(),
      avatar,
      selectedColor,
      isSecuring ? newPassword : undefined,
      isSecuring ? newPasswordHint : undefined
    );
  };

  const startEmergencyRescue = () => {
    if (!activeMatchedMember) return;
    setCountdown(10);
    setTerminalLogs(["[system] starting emergency bypass protocol...", "[system] authenticating bypass token on sync nodes..."]);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) {
          clearInterval(timer);
          return null;
        }
        if (prev <= 1) {
          clearInterval(timer);
          // Unlock accomplished: clear account password directly on store & log user in
          joinBoard(
            activeMatchedMember.name,
            activeMatchedMember.avatar,
            activeMatchedMember.color,
            "", // Wipe passcode
            ""  // Wipe hint
          );
          setCountdown(null);
          setIsForgotMode(false);
          setNewPassword("");
          setNewPasswordHint("");
          setEnteredPassword("");
          setErrorMsg("");
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    setCountdownTimer(timer);
  };

  useEffect(() => {
    if (countdown === null) return;
    const logInterval = setInterval(() => {
      const logs = [
        "WIPING_PASSCODE_LOCKOUT...",
        "OVERWRITING_GATEWAY_HASH...",
        "SYNTAX_BYPASS: AUTHORIZED",
        "ESTABLISHING_TLS_TUNNEL...",
        "PINGING_COLLAB_NODE...",
        "RELEASION_TOKEN: SUCCESS"
      ];
      const randomLog = logs[Math.floor(Math.random() * logs.length)];
      setTerminalLogs((prev) => [...prev, `[override] ${randomLog}`].slice(-5));
    }, 1200);

    return () => clearInterval(logInterval);
  }, [countdown]);

  // Handle case where user wants to register under completely different handle
  const handleClearCacheAndStartFresh = () => {
    setName("");
    setEnteredPassword("");
    setIsForgotMode(false);
    setCountdown(null);
    if (countdownTimer) clearInterval(countdownTimer);
    setErrorMsg("");
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        id="welcome-card" 
        className="bg-[#0c0c0c] border-2 border-white/20 text-white rounded-none max-w-md w-full p-6 md:p-8 shadow-2xl relative overflow-hidden animate-in fade-in duration-200"
      >
        {/* Glow accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-white/5 text-white border border-white/10 rounded-none mb-3">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-sm font-black text-white tracking-widest uppercase mb-1">
            // WORKSPACE HUB GATEWAY
          </h2>
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold font-mono">
            {isForgotMode ? "SECURITY RECOVERY SYSTEMS" : "Define handle to access sync board"}
          </p>
        </div>

        {isForgotMode ? (
          /* Forgot Password Mode visual panel */
          <div className="space-y-5">
            <div className="border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-500 text-xs font-black uppercase font-mono">
                <AlertTriangle className="w-4 h-4" />
                <span>Passcode Lockout Detected</span>
              </div>
              <p className="text-[10px] text-white/60 font-semibold leading-relaxed">
                 Teammate profile <span className="text-white font-black">"{activeMatchedMember?.name}"</span> is currently password secured.
              </p>
            </div>

            <div className="border border-white/10 p-3 bg-black space-y-1.5 rounded-none">
              <div className="flex items-center gap-1.5 text-[8px] font-black tracking-widest uppercase text-white/40 font-mono">
                <HelpCircle className="w-3 h-3 text-blue-500" />
                <span>Security Recovery Hint</span>
              </div>
              <p className="text-xs font-bold text-blue-400 italic font-mono uppercase bg-blue-950/20 px-2 py-1.5 border border-blue-900/30">
                "{activeMatchedMember?.passwordHint || "NO_RECOVERY_HINT_SET_BY_CREATOR"}"
              </p>
            </div>

            {countdown !== null ? (
              /* Emergency Bypass Terminal Logs animation */
              <div className="space-y-3 font-mono">
                <div className="bg-black border border-white/15 p-3 h-32 flex flex-col justify-between text-[10px]">
                  <div className="space-y-1 text-emerald-400">
                    {terminalLogs.map((log, i) => (
                      <div key={i} className="truncate select-none">{log}</div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-white/50 border-t border-white/10 pt-2 mt-2 text-[9px] font-black">
                    <span className="flex items-center gap-1">
                      <Terminal className="w-3 h-3 text-emerald-500 animate-pulse" />
                      SYSTEM BYPASS ACTIVE...
                    </span>
                    <span className="text-white text-xs">{countdown}s remaining</span>
                  </div>
                </div>
                <p className="text-[9px] text-white/40 uppercase font-semibold text-center tracking-normal">
                  Hold tight. System bypass is flashing memory buffers to release lockout...
                </p>
              </div>
            ) : (
              /* Normal recovery choices */
              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  onClick={startEmergencyRescue}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 font-black text-xs uppercase tracking-widest text-white rounded-none transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Trigger Rescue Protocol (10s)
                </button>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-black">
                  <button
                    type="button"
                    onClick={() => setIsForgotMode(false)}
                    className="py-2 bg-[#141414] hover:bg-[#1a1a1a] text-white border border-white/10 rounded-none uppercase transition"
                  >
                    Back to Entry
                  </button>
                  <button
                    type="button"
                    onClick={handleClearCacheAndStartFresh}
                    className="py-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 rounded-none uppercase transition"
                  >
                    Wipe & New Handle
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Normal Sign In Form */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Display Avatar preview */}
            <div className="flex flex-col items-center justify-center mb-1">
              <div className={`w-14 h-14 rounded-none ${selectedColor} flex items-center justify-center text-3.5xl border-2 border-white transition-all duration-150`}>
                {avatar}
              </div>
              {activeMatchedMember && (
                <div className="mt-2 text-[9px] text-emerald-500 font-black tracking-widest uppercase font-mono flex items-center gap-1 bg-emerald-950/10 px-2 py-0.5 border border-emerald-900/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Returning Collab Member
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5 font-mono">
                Teammate Handle (Name)
              </label>
              <input
                type="text"
                required
                placeholder="e.g. SARAH CONNOR"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrorMsg("");
                }}
                disabled={countdown !== null}
                className="w-full px-3 py-2 bg-black border border-white/20 hover:border-white/40 focus:border-white focus:outline-none rounded-none text-white placeholder-white/10 font-bold uppercase tracking-wider text-xs transition"
              />
              {errorMsg && (
                <p className="text-[10px] text-rose-500 mt-2 font-mono font-bold uppercase tracking-wider">
                  // ERROR: {errorMsg}
                </p>
              )}
            </div>

            {/* Password logic based on typed nickname matching */}
            {activeMatchedMember ? (
              /* If nickname is registered */
              hasPassword ? (
                /* Matches, and is protected */
                <div className="space-y-3 bg-[#111111] p-3.5 border border-white/10 animate-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 font-mono">
                      🔑 Enter Security Passcode
                    </label>
                    <span className="text-[8px] text-rose-400 font-mono font-black uppercase flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> SECURE PROFILE
                    </span>
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Enter profile password"
                    value={enteredPassword}
                    onChange={(e) => {
                      setEnteredPassword(e.target.value);
                      setErrorMsg("");
                    }}
                    className="w-full px-3 py-2 bg-black border border-white/25 focus:border-white focus:outline-none rounded-none text-white font-mono text-center tracking-widest text-sm transition"
                  />
                  <div className="flex justify-between items-center pt-1 text-[9px]">
                    <button
                      type="button"
                      onClick={() => setIsForgotMode(true)}
                      className="text-white/40 hover:text-white font-black uppercase tracking-wider underline transition"
                    >
                      Forgot password?
                    </button>
                    <span className="text-[8px] text-white/30 font-mono">PROTECTED SHIFT</span>
                  </div>
                </div>
              ) : (
                /* Matches, but no password set by owner */
                <div className="space-y-3 bg-[#111111] p-3.5 border border-white/5 animate-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-white/50 uppercase tracking-widest font-mono">
                      🛡️ Secure this profile now?
                    </span>
                    <span className="text-[8px] text-white/30 font-mono uppercase">Unlocked Account</span>
                  </div>
                  <p className="text-[9px] text-white/40 leading-relaxed uppercase">
                    You can optionally type a password to lock this handle so others cannot spoof your profile additions.
                  </p>
                  <div className="space-y-2">
                    <input
                      type="password"
                      placeholder="New password (optional)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-1.5 bg-black border border-white/10 focus:border-white focus:outline-none rounded-none text-white text-xs font-mono"
                    />
                    {newPassword && (
                      <input
                        type="text"
                        placeholder="Security Recovery Hint (e.g. favorite pet)"
                        value={newPasswordHint}
                        onChange={(e) => setNewPasswordHint(e.target.value)}
                        className="w-full px-3 py-1.5 bg-black border border-white/10 focus:border-white focus:outline-none rounded-none text-white text-[10px] font-semibold uppercase"
                      />
                    )}
                  </div>
                </div>
              )
            ) : (
              /* If nickname is entirely fresh - allow securing right away on signup */
              <div className="space-y-3 bg-[#111111] p-3 border border-white/5">
                <button
                  type="button"
                  onClick={() => setIsSecuring(!isSecuring)}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-white/60 hover:text-white transition"
                >
                  <span className={`w-3.5 h-3.5 border flex items-center justify-center ${isSecuring ? "bg-white text-black border-white" : "border-white/30"}`}>
                    {isSecuring ? "✓" : ""}
                  </span>
                  <span>Secure Profile Handle with password</span>
                </button>

                {isSecuring && (
                  <div className="space-y-2.5 pt-1.5 animate-in fade-in duration-100">
                    <input
                      type="password"
                      required={isSecuring}
                      placeholder="Set Secure Profile Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-white/20 focus:border-white focus:outline-none rounded-none text-white text-xs font-mono"
                    />
                    <input
                      type="text"
                      required={isSecuring}
                      placeholder="Password Recovery Hint"
                      value={newPasswordHint}
                      onChange={(e) => setNewPasswordHint(e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-white/20 focus:border-white focus:outline-none rounded-none text-white text-[10px] font-semibold uppercase font-sans"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Custom slider setup - hidden when entering a returns password profile to avoid visual clutter */}
            {(!activeMatchedMember || !hasPassword) && (
              <>
                {/* Select Avatar Slider */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5 font-mono">
                    Select Avatar Identifier
                  </label>
                  <div className="grid grid-cols-5 gap-2 p-2.5 bg-[#111111] border border-white/15">
                    {AVATARS.map((av) => (
                      <button
                        type="button"
                        key={av}
                        onClick={() => setAvatar(av)}
                        className={`text-2xl p-1 rounded-none hover:bg-white/10 transition duration-100 ${
                          avatar === av ? "bg-white/15 border border-white scale-105" : "border border-transparent"
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color theme selectors */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5 font-mono">
                    Signature Theme color
                  </label>
                  <div className="flex justify-between items-center px-1">
                    {COLORS.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setSelectedColor(col)}
                        className={`w-6 h-6 rounded-none ${col} border border-transparent transition-all duration-100 ${
                          selectedColor === col ? "border-white rotate-45 scale-125" : "hover:scale-110"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            <button
              id="join-action-btn"
              type="submit"
              disabled={countdown !== null}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/40 font-black text-xs uppercase tracking-widest text-white rounded-none shadow-lg transition duration-150"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{activeMatchedMember ? "Log in as teammate" : "Join Sync Workspace"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
