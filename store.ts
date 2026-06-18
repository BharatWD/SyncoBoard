/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from "zustand";
import { BoardState, Board, Column, Card, TeamMember, ActivityLog, CardTag, ChecklistItem } from "./types";

interface LiveDrag {
  cardId: string;
  columnId: string;
  index: number;
  memberId: string;
  memberName: string;
}

export interface StoreState extends BoardState {
  isSocketConnected: boolean;
  liveDrag: LiveDrag | null;
  error: string | null;
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  
  // App initialization
  init: () => void;
  setError: (msg: string | null) => void;
  
  // Board management
  setActiveBoard: (id: string) => void;
  addBoard: (name: string, description: string) => void;
  updateBoard: (id: string, name: string, description: string) => void;
  deleteBoard: (id: string) => void;
  
  // Column management
  addColumn: (title: string) => void;
  renameColumn: (id: string, title: string) => void;
  deleteColumn: (id: string) => void;
  
  // Card management
  addCard: (columnId: string, title: string, details: Partial<Card>) => void;
  updateCard: (id: string, updates: Partial<Card>) => void;
  deleteCard: (id: string) => void;
  moveCard: (cardId: string, sourceColId: string, destColId: string, targetIndex: number) => void;
  archiveCard: (id: string) => void;
  
  // Card Extras
  addComment: (cardId: string, text: string) => void;
  addChecklistItem: (cardId: string, text: string) => void;
  toggleChecklistItem: (cardId: string, itemId: string) => void;
  deleteChecklistItem: (cardId: string, itemId: string) => void;
  addTag: (cardId: string, tag: CardTag) => void;
  removeTag: (cardId: string, tagId: string) => void;
  toggleAssignee: (cardId: string, memberId: string) => void;
  
  // Collaboration / Member state
  joinBoard: (name: string, avatar: string, color: string, password?: string, passwordHint?: string) => void;
  focusCard: (cardId: string | null) => void;
  emitLiveDrag: (cardId: string, columnId: string, index: number) => void;
}

let socket: WebSocket | null = null;
const LOCAL_USER_KEY = "trello_collab_user";

export const useStore = create<StoreState>((set, get) => {
  // Sync state helper to broadcast client changes to backend
  const pushStateUpdate = (newState: Partial<BoardState>, actionDesc: string, targetType: ActivityLog["targetType"], targetId: string, targetName: string) => {
    const user = get().currentUser;
    if (!user) return;

    const logEntry: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: user.id,
      userName: user.name,
      action: actionDesc,
      targetType,
      targetId,
      targetName,
      createdAt: new Date().toISOString()
    };

    // Update locally
    const mergedState = {
      boards: { ...get().boards, ...newState.boards },
      columns: { ...get().columns, ...newState.columns },
      cards: { ...get().cards, ...newState.cards },
      members: { ...get().members, ...newState.members },
      activeBoardId: newState.activeBoardId !== undefined ? newState.activeBoardId : get().activeBoardId,
      currentUser: get().currentUser,
      logs: [logEntry, ...get().logs].slice(0, 50)
    };

    set(mergedState);

    // Send payload over WebSockets
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "state:update",
        payload: {
          state: mergedState,
          log: logEntry
        }
      }));
    }
  };

  const connectSocket = () => {
    if (socket) return;

    try {
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
      console.log("Connecting to websocket:", wsUrl);
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        set({ isSocketConnected: true, error: null });
        console.log("WebSocket connection verified");
        
        // Re-join if user session already exists
        const cachedUser = localStorage.getItem(LOCAL_USER_KEY);
        if (cachedUser) {
          const user = JSON.parse(cachedUser);
          set({ currentUser: user });
          ws.send(JSON.stringify({
            type: "user:join",
            payload: { member: user }
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case "state:sync": {
              const serverState = message.payload;
              const cachedUser = get().currentUser;

              set({
                boards: serverState.boards,
                columns: serverState.columns,
                cards: serverState.cards,
                members: serverState.members,
                activeBoardId: get().activeBoardId || serverState.activeBoardId,
                logs: serverState.logs
              });

              // Keep local user matched to active status
              if (cachedUser && serverState.members[cachedUser.id]) {
                set({ currentUser: serverState.members[cachedUser.id] });
              }
              break;
            }

            case "user:presence_update": {
              const { members } = message.payload;
              set({ members });
              const current = get().currentUser;
              if (current && members[current.id]) {
                set({ currentUser: members[current.id] });
              }
              break;
            }

            case "card:live_dragging": {
              const { cardId, columnId, index, memberId } = message.payload;
              const member = get().members[memberId];
              if (member) {
                set({
                  liveDrag: {
                    cardId,
                    columnId,
                    index,
                    memberId,
                    memberName: member.name
                  }
                });
                // Auto-clear active dragging styling after quiet delay
                setTimeout(() => {
                  const state = get();
                  if (state.liveDrag && state.liveDrag.cardId === cardId && state.liveDrag.memberId === memberId) {
                    set({ liveDrag: null });
                  }
                }, 4000);
              }
              break;
            }
          }
        } catch (e) {
          console.error("Failed handling incoming socket broadcast:", e);
        }
      };

      ws.onclose = () => {
        set({ isSocketConnected: false });
        socket = null;
        console.warn("WebSocket closed. Reconnecting in 3 seconds...");
        setTimeout(() => connectSocket(), 3000);
      };

      ws.onerror = (e) => {
        console.error("WebSocket transport error:", e);
        set({ isSocketConnected: false, error: "Connection problem. Trying to reconnect..." });
      };

      socket = ws;
    } catch (e) {
      console.error("Socket error", e);
    }
  };

  return {
    boards: {},
    columns: {},
    cards: {},
    members: {},
    activeBoardId: null,
    currentUser: null,
    logs: [],
    isSocketConnected: false,
    liveDrag: null,
    error: null,
    theme: (typeof window !== "undefined" && localStorage.getItem("collab_theme") as "dark" | "light") || "dark",

    setTheme: (theme) => {
      localStorage.setItem("collab_theme", theme);
      set({ theme });
      if (theme === "light") {
        document.body.classList.add("light");
      } else {
        document.body.classList.remove("light");
      }
    },

    init: () => {
      // Connect to Socket
      connectSocket();

      // Load and apply theme
      const currentTheme = get().theme;
      if (currentTheme === "light") {
        document.body.classList.add("light");
      } else {
        document.body.classList.remove("light");
      }

      // Fetch initial state through REST first in case WS was establishing
      fetch("/api/state")
        .then((res) => res.json())
        .then((data: BoardState) => {
          const params = new URLSearchParams(window.location.search);
          const boardParam = params.get("boardId");
          const targetBoardId = boardParam && data.boards[boardParam]
            ? boardParam
            : (get().activeBoardId || data.activeBoardId || Object.keys(data.boards)[0] || null);

          set({
            boards: data.boards,
            columns: data.columns,
            cards: data.cards,
            members: data.members,
            activeBoardId: targetBoardId,
            logs: data.logs
          });
        })
        .catch((err) => {
          console.error("Error doing initial REST fetch:", err);
          set({ error: "Could not fetch state. Running offline-first." });
        });
    },

    setError: (msg) => set({ error: msg }),

    joinBoard: (name, avatar, color, password, passwordHint) => {
      const matched = Object.values(get().members).find(
        (m) => m.name.trim().toLowerCase() === name.trim().toLowerCase()
      );
      const memberId = matched ? matched.id : (get().currentUser?.id || `user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`);
      
      const newMember: TeamMember = {
        id: memberId,
        name,
        avatar,
        color,
        isOnline: true,
        password: password !== undefined ? password : matched?.password,
        passwordHint: passwordHint !== undefined ? passwordHint : matched?.passwordHint
      };

      set({ currentUser: newMember });
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newMember));

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: "user:join",
          payload: { member: newMember }
        }));
      } else {
        // Safe mock fallback for offline operation
        set((state) => ({
          members: { ...state.members, [memberId]: newMember }
        }));
      }
    },

    focusCard: (cardId) => {
      const user = get().currentUser;
      if (!user) return;

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: "user:focus",
          payload: { memberId: user.id, cardId }
        }));
      }
    },

    emitLiveDrag: (cardId, columnId, index) => {
      const user = get().currentUser;
      if (!user) return;

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: "card:drag",
          payload: { cardId, columnId, index, memberId: user.id }
        }));
      }
    },

    setActiveBoard: (id) => {
      set({ activeBoardId: id });
    },

    addBoard: (name, description) => {
      const id = `board-${Date.now()}`;
      const newBoard: Board = {
        id,
        name,
        description,
        columnIds: [],
        createdAt: new Date().toISOString()
      };

      const originalBoards = get().boards;
      pushStateUpdate(
        { boards: { ...originalBoards, [id]: newBoard }, activeBoardId: id },
        "created board",
        "board",
        id,
        name
      );
    },

    updateBoard: (id, name, description) => {
      const board = get().boards[id];
      if (!board) return;

      const updatedBoard = { ...board, name, description };
      pushStateUpdate(
        { boards: { ...get().boards, [id]: updatedBoard } },
        "updated board settings",
        "board",
        id,
        name
      );
    },

    deleteBoard: (id) => {
      const board = get().boards[id];
      if (!board) return;

      const remainingBoards = { ...get().boards };
      delete remainingBoards[id];

      const boardKeys = Object.keys(remainingBoards);
      const nextActiveBoard = boardKeys.length > 0 ? boardKeys[0] : null;

      pushStateUpdate(
        { boards: remainingBoards, activeBoardId: nextActiveBoard },
        "deleted board",
        "board",
        id,
        board.name
      );
    },

    addColumn: (title) => {
      const activeBoardId = get().activeBoardId;
      if (!activeBoardId) return;

      const colId = `col-${Date.now()}`;
      const newColumn: Column = {
        id: colId,
        boardId: activeBoardId,
        title,
        cardIds: []
      };

      const board = get().boards[activeBoardId];
      const updatedBoard = {
        ...board,
        columnIds: [...board.columnIds, colId]
      };

      pushStateUpdate(
        {
          columns: { ...get().columns, [colId]: newColumn },
          boards: { ...get().boards, [activeBoardId]: updatedBoard }
        },
        `added list "${title}"`,
        "column",
        colId,
        title
      );
    },

    renameColumn: (id, title) => {
      const col = get().columns[id];
      if (!col) return;

      const updatedCol = { ...col, title };
      pushStateUpdate(
        { columns: { ...get().columns, [id]: updatedCol } },
        `renamed list to "${title}"`,
        "column",
        id,
        title
      );
    },

    deleteColumn: (id) => {
      const col = get().columns[id];
      if (!col) return;

      const activeBoardId = get().activeBoardId;
      if (!activeBoardId) return;

      const remainingColumns = { ...get().columns };
      delete remainingColumns[id];

      const board = get().boards[activeBoardId];
      const updatedBoard = {
        ...board,
        columnIds: board.columnIds.filter((cid) => cid !== id)
      };

      pushStateUpdate(
        {
          columns: remainingColumns,
          boards: { ...get().boards, [activeBoardId]: updatedBoard }
        },
        `removed list "${col.title}"`,
        "column",
        id,
        col.title
      );
    },

    addCard: (columnId, title, details) => {
      const activeBoardId = get().activeBoardId;
      if (!activeBoardId) return;

      const cardId = `card-${Date.now()}`;
      const column = get().columns[columnId];
      const isCompleted = column && (column.title.toLowerCase() === "completed" || column.title.toLowerCase() === "done");

      const newCard: Card = {
        id: cardId,
        boardId: activeBoardId,
        columnId,
        title,
        description: details.description || "",
        tags: details.tags || [],
        assignees: details.assignees || [],
        checklist: details.checklist || [],
        comments: [],
        dueDate: details.dueDate,
        priority: details.priority || "medium",
        createdAt: new Date().toISOString(),
        completedAt: isCompleted ? new Date().toISOString() : undefined
      };

      const updatedCol = {
        ...column,
        cardIds: [...column.cardIds, cardId]
      };

      pushStateUpdate(
        {
          cards: { ...get().cards, [cardId]: newCard },
          columns: { ...get().columns, [columnId]: updatedCol }
        },
        `added task "${title}"`,
        "card",
        cardId,
        title
      );
    },

    updateCard: (id, updates) => {
      const card = get().cards[id];
      if (!card) return;

      const updatedCard = { ...card, ...updates };
      pushStateUpdate(
        { cards: { ...get().cards, [id]: updatedCard } },
        `updated task "${card.title}"`,
        "card",
        id,
        card.title
      );
    },

    deleteCard: (id) => {
      const card = get().cards[id];
      if (!card) return;

      const remainingCards = { ...get().cards };
      delete remainingCards[id];

      const col = get().columns[card.columnId];
      const updatedCol = {
        ...col,
        cardIds: col.cardIds.filter((cid) => cid !== id)
      };

      pushStateUpdate(
        {
          cards: remainingCards,
          columns: { ...get().columns, [card.columnId]: updatedCol }
        },
        `deleted task "${card.title}"`,
        "card",
        id,
        card.title
      );
    },

    moveCard: (cardId, sourceColId, destColId, targetIndex) => {
      const card = get().cards[cardId];
      const sourceCol = get().columns[sourceColId];
      const destCol = get().columns[destColId];
      if (!card || !sourceCol || !destCol) return;

      // Filter out cardId from source list
      const sourceCardIds = sourceCol.cardIds.filter((cid) => cid !== cardId);
      
      let destCardIds = [...destCol.cardIds];
      if (sourceColId === destColId) {
        // Handle moving inside same column
        destCardIds = destCardIds.filter((cid) => cid !== cardId);
      }

      // Insert cardId at index
      destCardIds.splice(targetIndex, 0, cardId);

      const isDestCompletedCol = destCol && (destCol.title.toLowerCase() === "completed" || destCol.title.toLowerCase() === "done");
      const completedAtVal = isDestCompletedCol ? (card.completedAt || new Date().toISOString()) : undefined;

      // Create update maps
      const updatedCards = {
        ...get().cards,
        [cardId]: { ...card, columnId: destColId, completedAt: completedAtVal }
      };

      const updatedColumns = {
        ...get().columns,
        [sourceColId]: { ...sourceCol, cardIds: sourceCardIds },
        [destColId]: { ...destCol, cardIds: destCardIds }
      };

      // Apply locally instantly for lag-free performance, then push state
      set({ cards: updatedCards, columns: updatedColumns });

      pushStateUpdate(
        { cards: updatedCards, columns: updatedColumns },
        `moved task "${card.title}" to ${destCol.title}`,
        "card",
        cardId,
        card.title
      );
    },

    archiveCard: (id) => {
      const card = get().cards[id];
      if (!card) return;

      const updatedCard = { ...card, isArchived: true };
      pushStateUpdate(
        { cards: { ...get().cards, [id]: updatedCard } },
        `archived task "${card.title}"`,
        "card",
        id,
        card.title
      );
    },

    addComment: (cardId, text) => {
      const card = get().cards[cardId];
      const user = get().currentUser;
      if (!card || !user) return;

      const commentId = `comment-${Date.now()}`;
      const newComment = {
        id: commentId,
        authorId: user.id,
        authorName: user.name,
        authorAvatar: user.avatar,
        text,
        createdAt: new Date().toISOString()
      };

      const updatedCard = {
        ...card,
        comments: [...card.comments, newComment]
      };

      pushStateUpdate(
        { cards: { ...get().cards, [cardId]: updatedCard } },
        `commented on task "${card.title}"`,
        "card",
        cardId,
        card.title
      );
    },

    addChecklistItem: (cardId, text) => {
      const card = get().cards[cardId];
      if (!card) return;

      const itemId = `item-${Date.now()}`;
      const newItem: ChecklistItem = {
        id: itemId,
        text,
        completed: false
      };

      const updatedCard = {
        ...card,
        checklist: [...card.checklist, newItem]
      };

      pushStateUpdate(
        { cards: { ...get().cards, [cardId]: updatedCard } },
        `added checklist item to "${card.title}"`,
        "card",
        cardId,
        card.title
      );
    },

    toggleChecklistItem: (cardId, itemId) => {
      const card = get().cards[cardId];
      if (!card) return;

      const updatedChecklist = card.checklist.map((item) => {
        if (item.id === itemId) {
          return { ...item, completed: !item.completed };
        }
        return item;
      });

      const updatedCard = {
        ...card,
        checklist: updatedChecklist
      };

      pushStateUpdate(
        { cards: { ...get().cards, [cardId]: updatedCard } },
        `updated checklist in "${card.title}"`,
        "card",
        cardId,
        card.title
      );
    },

    deleteChecklistItem: (cardId, itemId) => {
      const card = get().cards[cardId];
      if (!card) return;

      const updatedChecklist = card.checklist.filter((item) => item.id !== itemId);
      const updatedCard = {
        ...card,
        checklist: updatedChecklist
      };

      pushStateUpdate(
        { cards: { ...get().cards, [cardId]: updatedCard } },
        `removed checklist item from "${card.title}"`,
        "card",
        cardId,
        card.title
      );
    },

    addTag: (cardId, tag) => {
      const card = get().cards[cardId];
      if (!card) return;

      // Prevent duplicate styling tags
      if (card.tags.some((t) => t.id === tag.id || t.text === tag.text)) return;

      const updatedCard = {
        ...card,
        tags: [...card.tags, tag]
      };

      pushStateUpdate(
        { cards: { ...get().cards, [cardId]: updatedCard } },
        `added label "${tag.text}" to "${card.title}"`,
        "card",
        cardId,
        card.title
      );
    },

    removeTag: (cardId, tagId) => {
      const card = get().cards[cardId];
      if (!card) return;

      const updatedCard = {
        ...card,
        tags: card.tags.filter((t) => t.id !== tagId)
      };

      pushStateUpdate(
        { cards: { ...get().cards, [cardId]: updatedCard } },
        `removed label from "${card.title}"`,
        "card",
        cardId,
        card.title
      );
    },

    toggleAssignee: (cardId, memberId) => {
      const card = get().cards[cardId];
      const member = get().members[memberId];
      if (!card || !member) return;

      const isExistent = card.assignees.includes(memberId);
      const updatedAssignees = isExistent
        ? card.assignees.filter((id) => id !== memberId)
        : [...card.assignees, memberId];

      const updatedCard = {
        ...card,
        assignees: updatedAssignees
      };

      pushStateUpdate(
        { cards: { ...get().cards, [cardId]: updatedCard } },
        isExistent
          ? `unassigned ${member.name} from "${card.title}"`
          : `assigned ${member.name} to "${card.title}"`,
        "card",
        cardId,
        card.title
      );
    }
  };
});
