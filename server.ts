/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { BoardState, TeamMember, ActivityLog, Board, Column, Card } from "./src/types";

const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "board_data.json");

// Default initial state generator
const createDefaultState = (): BoardState => {
  const boardId1 = "board-1";
  const colId1 = "col-1";
  const colId2 = "col-2";
  const colId3 = "col-3";
  const colId4 = "col-4";

  const defaultMembers: { [id: string]: TeamMember } = {
    "user-1": { id: "user-1", name: "Sarah Connor", avatar: "👩‍💻", color: "bg-indigo-500", isOnline: false },
    "user-2": { id: "user-2", name: "John Doe", avatar: "🧔", color: "bg-emerald-500", isOnline: false },
    "user-3": { id: "user-3", name: "Alex Mercer", avatar: "🧑‍🎨", color: "bg-amber-500", isOnline: false },
    "user-4": { id: "user-4", name: "Elena Rostova", avatar: "👩‍🚀", color: "bg-rose-500", isOnline: false },
  };

  const defaultBoards: { [id: string]: Board } = {
    [boardId1]: {
      id: boardId1,
      name: "Product Sprint • Q3",
      description: "Development sprint board for our quarterly release. Let's stay on track!",
      columnIds: [colId1, colId2, colId3, colId4],
      createdAt: new Date().toISOString(),
    },
  };

  const defaultColumns: { [id: string]: Column } = {
    [colId1]: { id: colId1, boardId: boardId1, title: "Backlog", cardIds: ["card-1", "card-2"] },
    [colId2]: { id: colId2, boardId: boardId1, title: "In Progress", cardIds: ["card-3"] },
    [colId3]: { id: colId3, boardId: boardId1, title: "In Review", cardIds: ["card-4"] },
    [colId4]: { id: colId4, boardId: boardId1, title: "Completed", cardIds: ["comp-1", "comp-2", "comp-3", "comp-4", "comp-5", "comp-6", "comp-7"] },
  };

  const defaultCards: { [id: string]: Card } = {
    "card-1": {
      id: "card-1",
      boardId: boardId1,
      columnId: colId1,
      title: "Integrate Real-Time WebSockets Sync",
      description: "Establish a robust bi-directional communication channel with Express server for instant state sync and board reactivity.",
      tags: [
        { id: "tag-1", text: "Feature", color: "bg-blue-600/30 text-blue-400 border-blue-500/50" },
        { id: "tag-2", text: "Backend", color: "bg-violet-600/30 text-violet-400 border-violet-500/50" }
      ],
      assignees: ["user-1"],
      checklist: [
        { id: "item-1", text: "Create WebSocket connection handler", completed: true },
        { id: "item-2", text: "Implement delta state broadcast", completed: true },
        { id: "item-3", text: "Add auto-reconnect fallback mechanism", completed: false }
      ],
      comments: [
        {
          id: "comment-1",
          authorId: "user-2",
          authorName: "John Doe",
          authorAvatar: "🧔",
          text: "I finished reviewing the setup, works like a charm locally!",
          createdAt: new Date(Date.now() - 3600000).toISOString()
        }
      ],
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      priority: "high",
      createdAt: new Date().toISOString(),
    },
    "card-2": {
      id: "card-2",
      boardId: boardId1,
      columnId: colId1,
      title: "UI Polishing & Micro-interactions",
      description: "Enhance user experience by creating smooth slide animations for dragging cards, custom focus highlights, and elegant hover responsive cards.",
      tags: [
        { id: "tag-3", text: "UI/UX", color: "bg-fuchsia-600/30 text-fuchsia-400 border-fuchsia-500/50" }
      ],
      assignees: ["user-3"],
      checklist: [
        { id: "item-4", text: "Import lucide icons", completed: true },
        { id: "item-5", text: "Add smooth drag-over visual indicator lines", completed: false }
      ],
      comments: [],
      priority: "medium",
      createdAt: new Date().toISOString(),
    },
    "card-3": {
      id: "card-3",
      boardId: boardId1,
      columnId: colId2,
      title: "Zustand State Store Architecture",
      description: "Define clean interfaces for cards, boards, and members in a centralized store. Synchronize with external backend efficiently.",
      tags: [
        { id: "tag-4", text: "Feature", color: "bg-blue-600/30 text-blue-400 border-blue-500/50" }
      ],
      assignees: ["user-1", "user-4"],
      checklist: [
        { id: "item-6", text: "Setup Zustand boilerplate", completed: true },
        { id: "item-7", text: "Ensure full types safety across board operations", completed: true }
      ],
      comments: [],
      dueDate: new Date().toISOString().split('T')[0],
      priority: "medium",
      createdAt: new Date().toISOString(),
    },
    "card-4": {
      id: "card-4",
      boardId: boardId1,
      columnId: colId3,
      title: "Refactor Rich Markdown Editor",
      description: "Ensure card descriptions and comment text can render Markdown seamlessly using a standard viewer or simple parser.",
      tags: [
        { id: "tag-5", text: "Docs", color: "bg-emerald-600/30 text-emerald-400 border-emerald-500/50" }
      ],
      assignees: ["user-2"],
      checklist: [],
      comments: [],
      priority: "low",
      createdAt: new Date().toISOString(),
    },
    "comp-1": {
      id: "comp-1",
      boardId: boardId1,
      columnId: colId4,
      title: "Configure Docker Ingress & SSL",
      description: "Setup Kubernetes Nginx ingress controller and integrated with Let's Encrypt for automatic SSL cluster renewals.",
      tags: [{ id: "tag-backend", text: "Backend", color: "bg-violet-600/30 text-violet-400 border-violet-500/50" }],
      assignees: ["user-1"],
      checklist: [],
      comments: [],
      priority: "high",
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      completedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    },
    "comp-2": {
      id: "comp-2",
      boardId: boardId1,
      columnId: colId4,
      title: "Design Palette System & Branding",
      description: "Define tailwind design variables, branding guidelines, and typography scales for dark mode dashboard layout.",
      tags: [{ id: "tag-ui", text: "UI/UX", color: "bg-fuchsia-600/30 text-fuchsia-400 border-fuchsia-500/50" }],
      assignees: ["user-3"],
      checklist: [],
      comments: [],
      priority: "medium",
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      completedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    "comp-3": {
      id: "comp-3",
      boardId: boardId1,
      columnId: colId4,
      title: "Secure Auth Cookies & Sessions",
      description: "Ensure secure HTTP-only cookies are used with CSRF tokens for user session validation.",
      tags: [{ id: "tag-backend", text: "Backend", color: "bg-violet-600/30 text-violet-400 border-violet-500/50" }],
      assignees: ["user-2"],
      checklist: [],
      comments: [],
      priority: "high",
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      completedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    "comp-4": {
      id: "comp-4",
      boardId: boardId1,
      columnId: colId4,
      title: "Database Migration Script V1",
      description: "Completed full migration scheme setup from legacy relational structures.",
      tags: [{ id: "tag-backend", text: "Backend", color: "bg-violet-600/30 text-violet-400 border-violet-500/50" }],
      assignees: ["user-1"],
      checklist: [],
      comments: [],
      priority: "medium",
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      completedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    "comp-5": {
      id: "comp-5",
      boardId: boardId1,
      columnId: colId4,
      title: "Integrate Sentry Error Tracking",
      description: "Install Sentry client hooks to automatically report issues to Dev Slack channel.",
      tags: [{ id: "tag-feature", text: "Feature", color: "bg-blue-600/30 text-blue-400 border-blue-500/50" }],
      assignees: ["user-4"],
      checklist: [],
      comments: [],
      priority: "low",
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      completedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    "comp-6": {
      id: "comp-6",
      boardId: boardId1,
      columnId: colId4,
      title: "Setup Development Environment",
      description: "Established clean workspace scripts and environment configuration files.",
      tags: [{ id: "tag-doc", text: "Docs", color: "bg-emerald-600/30 text-emerald-400 border-emerald-500/50" }],
      assignees: ["user-2", "user-3"],
      checklist: [],
      comments: [],
      priority: "low",
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      completedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    "comp-7": {
      id: "comp-7",
      boardId: boardId1,
      columnId: colId4,
      title: "Initial Client Consultation",
      description: "Review milestones, deadlines, and project requirements with leadership team.",
      tags: [{ id: "tag-doc", text: "Docs", color: "bg-emerald-600/30 text-emerald-400 border-emerald-500/50" }],
      assignees: ["user-1", "user-4"],
      checklist: [],
      comments: [],
      priority: "medium",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      completedAt: new Date().toISOString(),
    }
  };

  return {
    boards: defaultBoards,
    columns: defaultColumns,
    cards: defaultCards,
    members: defaultMembers,
    activeBoardId: boardId1,
    currentUser: null,
    logs: [
      {
        id: "log-1",
        userId: "user-1",
        userName: "Sarah Connor",
        action: "created board",
        targetType: "board",
        targetId: boardId1,
        targetName: "Product Sprint • Q3",
        createdAt: new Date().toISOString()
      }
    ]
  };
};

// State store on backend
let appState: BoardState = createDefaultState();

// Load persistent state
try {
  if (fs.existsSync(DATA_FILE)) {
    const rawData = fs.readFileSync(DATA_FILE, "utf-8");
    appState = JSON.parse(rawData);
    // Ensure offline-first user-states are clean when server restarts
    Object.keys(appState.members).forEach(id => {
      appState.members[id].isOnline = false;
      appState.members[id].currentCardId = undefined;
    });
    console.log("Persisted state loaded from board_data.json");
  } else {
    fs.writeFileSync(DATA_FILE, JSON.stringify(appState, null, 2), "utf-8");
    console.log("Default state initialized and saved to board_data.json");
  }
} catch (err) {
  console.error("Error loading persisted state:", err);
}

// Save helper
const saveStateToFile = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(appState, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving persisted state:", err);
  }
};

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Route to fetch active state
  app.get("/api/state", (req, res) => {
    res.json(appState);
  });

  // REST API fallbacks/updates
  app.post("/api/state/reset", (req, res) => {
    appState = createDefaultState();
    saveStateToFile();
    res.json({ success: true, state: appState });
  });

  const server = createServer(app);

  // Initialize WebSockets
  const wss = new WebSocketServer({ noServer: true });
  
  // Track active clients with their assigned memberIds
  const clients = new Map<WebSocket, string>();

  // WebSocket protocol
  wss.on("connection", (ws: WebSocket) => {
    console.log("New WebSocket connection established.");

    ws.on("message", (message: string) => {
      try {
        const data = JSON.parse(message);
        console.log("WS Received type:", data.type);

        switch (data.type) {
          case "user:join": {
            // User registered their profile
            const { member } = data.payload;
            
            // Add or updates member
            appState.members[member.id] = {
              ...member,
              isOnline: true
            };
            
            clients.set(ws, member.id);
            
            // Add activity log
            const logEntry: ActivityLog = {
              id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              userId: member.id,
              userName: member.name,
              action: "joined the board",
              targetType: "member",
              targetId: member.id,
              targetName: member.name,
              createdAt: new Date().toISOString()
            };
            appState.logs.unshift(logEntry);
            if (appState.logs.length > 50) appState.logs.pop();

            saveStateToFile();
            
            // Broadcast full state update to allow seamless join
            broadcast({ type: "state:sync", payload: appState });
            break;
          }

          case "user:focus": {
            const { memberId, cardId } = data.payload;
            if (appState.members[memberId]) {
              appState.members[memberId].currentCardId = cardId;
              broadcast({ type: "user:presence_update", payload: { members: appState.members } });
            }
            break;
          }

          case "state:update": {
            // Received a full state block from direct mutations
            const { state, log } = data.payload;
            
            // Preserve user online status while merging
            const currentOnlineIds = new Set<string>();
            Object.values(appState.members).forEach(m => {
              if (m.isOnline) currentOnlineIds.add(m.id);
            });

            appState.boards = state.boards;
            appState.columns = state.columns;
            appState.cards = state.cards;
            appState.activeBoardId = state.activeBoardId;

            // Merge members but retain their runtime custom parameters like online status & positions
            Object.keys(state.members).forEach(id => {
              if (appState.members[id]) {
                appState.members[id] = {
                  ...state.members[id],
                  isOnline: currentOnlineIds.has(id),
                  currentCardId: appState.members[id].currentCardId
                };
              } else {
                appState.members[id] = state.members[id];
              }
            });

            if (log) {
              appState.logs.unshift(log);
              if (appState.logs.length > 50) appState.logs.pop();
            }

            saveStateToFile();
            broadcast({ type: "state:sync", payload: appState });
            break;
          }

          case "card:drag": {
            // Drag delta payload to make the UX extremely smooth across sessions with live drag indicators
            const { cardId, columnId, index, memberId } = data.payload;
            broadcast({ type: "card:live_dragging", payload: { cardId, columnId, index, memberId } }, ws);
            break;
          }

          default:
            console.warn("Unhandled WS action type:", data.type);
        }
      } catch (err) {
        console.error("Failed to parse websocket message:", err);
      }
    });

    ws.on("close", () => {
      const memberId = clients.get(ws);
      if (memberId) {
        console.log(`User left: ${appState.members[memberId]?.name}`);
        if (appState.members[memberId]) {
          appState.members[memberId].isOnline = false;
          appState.members[memberId].currentCardId = undefined;
        }
        clients.delete(ws);

        const logEntry: ActivityLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          userId: memberId,
          userName: appState.members[memberId]?.name || "Someone",
          action: "left the board",
          targetType: "member",
          targetId: memberId,
          targetName: appState.members[memberId]?.name || "Someone",
          createdAt: new Date().toISOString()
        };
        appState.logs.unshift(logEntry);
        
        saveStateToFile();
        broadcast({ type: "state:sync", payload: appState });
      }
    });
  });

  const broadcast = (messageObj: any, excludeWs?: WebSocket) => {
    const rawMsg = JSON.stringify(messageObj);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client !== excludeWs) {
        client.send(rawMsg);
      }
    });
  };

  // Upgrade WebSocket transport
  server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;
    if (pathname === "/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // Vite Integration for Assets and SSR
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Active server launch
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Express + WS Server] Running perfectly on http://localhost:${PORT}`);
  });
}

startServer();
