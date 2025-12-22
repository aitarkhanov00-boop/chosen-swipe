// lib/store.ts — универсальная версия (и локально, и Vercel)
import fs from 'fs';
import path from 'path';

export interface Board { id: string; [key: string]: any; }
export interface Vote { id: string; boardId: string; [key: string]: any; }

const isVercel = !!process.env.VERCEL;

const boards: Board[] = [];
const votes: Vote[] = [];

const DATA_DIR = path.join(process.cwd(), 'data');
const BOARDS_FILE = path.join(DATA_DIR, 'boards.json');

// Только если НЕ Vercel — пытаемся работать с файлами
if (!isVercel) {
  if (!fs.existsSync(DATA_DIR)) {
    try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch {}
  }
  if (fs.existsSync(BOARDS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(BOARDS_FILE, 'utf-8'));
      boards.push(...(data.boards || []));
      votes.push(...(data.votes || []));
    } catch (e) { console.error("Failed to load data", e); }
  }
}

function saveToFile() {
  if (isVercel) return; // на Vercel НЕ сохраняем
  try {
    fs.writeFileSync(BOARDS_FILE, JSON.stringify({ boards, votes }, null, 2));
  } catch (e) { console.error("Failed to save", e); }
}

// Остальные функции без изменений
export function createBoard(boardData: Omit<Board, 'id'>): Board {
  const board = { id: Date.now() + Math.random().toString(36).slice(2), ...boardData };
  boards.push(board);
  saveToFile();
  return board;
}

export function getBoard(id: string) { return boards.find(b => b.id === id); }
export function addVote(boardId: string, voteData: any) {
  const vote = { id: Date.now() + Math.random().toString(36).slice(2), boardId, ...voteData };
  votes.push(vote);
  saveToFile();
  return vote;
}
export function getResults(boardId: string) { return votes.filter(v => v.boardId === boardId); }