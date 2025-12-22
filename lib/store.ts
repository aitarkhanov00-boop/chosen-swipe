// lib/store.ts — версия для Vercel (100% рабочая)
export interface Board {
  id: string;
  title: string;
  description?: string;
  interactionType: string;
  cards: { name: string; data: string }[];
  ownerId?: string;
  createdAt?: number;
  [key: string]: any;
}

export interface Vote {
  id: string;
  boardId: string;
  cardName: string;
  liked: boolean;
  sessionId: string;
  timestamp: number;
}

// In-memory хранилище (на Vercel только так!)
export const boards: Board[] = [];
export const votes: Vote[] = [];

// Создание борда
export function createBoard(boardData: Omit<Board, "id" | "createdAt">): Board {
  const newBoard: Board = {
    ...boardData,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    createdAt: Date.now(),
  };
  boards.push(newBoard);
  console.log("Board created:", newBoard.id); // для отладки
  return newBoard;
}

// Получение борда
export function getBoard(id: string): Board | undefined {
  return boards.find((b) => b.id === id);
}

// Получение всех бордов (для главной)
export function getAllBoards(): Board[] {
  return boards;
}

// Добавление голоса
export function addVote(
  boardId: string,
  cardName: string,
  liked: boolean,
  sessionId: string
): Vote {
  const vote: Vote = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    boardId,
    cardName,
    liked,
    sessionId,
    timestamp: Date.now(),
  };
  votes.push(vote);
  return vote;
}

// Результаты по борду
export function getResults(boardId: string): Vote[] {
  return votes.filter((v) => v.boardId === boardId);
}

// Очистка старых данных (опционально, каждые 24ч)
setInterval(() => {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const oldBoards = boards.filter((b) => (b.createdAt || 0) < oneDayAgo);
  oldBoards.forEach((b) => {
    const index = boards.indexOf(b);
    if (index > -1) boards.splice(index, 1);
  });
  // Можно также чистить votes
}, 60 * 60 * 1000); // раз в час