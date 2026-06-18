/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface CardComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
}

export interface CardTag {
  id: string;
  text: string;
  color: string; // Tailwind color class or hex string
}

export interface Card {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description: string;
  tags: CardTag[];
  assignees: string[]; // Member IDs
  checklist: ChecklistItem[];
  comments: CardComment[];
  dueDate?: string;
  priority?: "low" | "medium" | "high";
  createdAt: string;
  isArchived?: boolean;
  completedAt?: string;
}

export interface Column {
  id: string;
  boardId: string;
  title: string;
  cardIds: string[];
}

export interface Board {
  id: string;
  name: string;
  description: string;
  columnIds: string[];
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  avatar: string; // Emoji or image URL
  color: string; // Tailwind bg color class
  isOnline: boolean;
  currentCardId?: string; // If viewing/editing a card
  password?: string;
  passwordHint?: string;
}

export interface BoardState {
  boards: { [id: string]: Board };
  columns: { [id: string]: Column };
  cards: { [id: string]: Card };
  members: { [id: string]: TeamMember };
  activeBoardId: string | null;
  currentUser: TeamMember | null;
  logs: ActivityLog[];
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  targetType: "board" | "column" | "card" | "comment" | "member";
  targetId: string;
  targetName: string;
  createdAt: string;
}
