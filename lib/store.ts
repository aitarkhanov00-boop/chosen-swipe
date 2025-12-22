import fs from 'fs';
import path from 'path';

// Типы данных
export interface Board {
  id: string;
  [key: string]: any;
}

export interface Vote {
  id: string;
  boardId: string;
  [key: string]: any;
}

// In-memory хранилище
export const boards: Board[] = [];
export const votes: Vote[] = [];

// Путь к файлу данных
const DATA_DIR = path.join(process.cwd(), 'data');
const BOARDS_FILE = path.join(DATA_DIR, 'boards.json');

// Инициализация: загрузка данных из JSON при старте
function initializeStore() {
  // На Vercel не пытаемся создавать папку и читать файл
  if (!process.env.VERCEL) {
    // Создаем папку data, если её нет
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (e) {
        console.log("Cannot create data dir (Vercel?), using in-memory only");
      }
    }

    // Загружаем данные из JSON, если файл существует
    if (fs.existsSync(BOARDS_FILE)) {
      try {
        const fileContent = fs.readFileSync(BOARDS_FILE, 'utf-8');
        const data = JSON.parse(fileContent);

        if (data.boards && Array.isArray(data.boards)) {
          boards.push(...data.boards);
        }
        if (data.votes && Array.isArray(data.votes)) {
          votes.push(...data.votes);
        }
      } catch (error) {
        console.error('Error loading data from JSON:', error);
      }
    }
  } else {
    console.log("Running on Vercel — using in-memory store only");
  }
}

  // Загружаем данные из JSON, если файл существует
  if (fs.existsSync(BOARDS_FILE)) {
    try {
      const fileContent = fs.readFileSync(BOARDS_FILE, 'utf-8');
      const data = JSON.parse(fileContent);
      
      if (data.boards && Array.isArray(data.boards)) {
        boards.push(...data.boards);
      }
      if (data.votes && Array.isArray(data.votes)) {
        votes.push(...data.votes);
      }
    } catch (error) {
      console.error('Error loading data from JSON:', error);
    }
  }
}

// Сохранение данных в JSON
function saveToFile() {
  // На Vercel файловая система read-only — просто пропускаем запись
  if (process.env.VERCEL) {
    console.log("Vercel detected — data saved only in memory");
    return;
  }

  try {
    const data = {
      boards,
      votes,
    };
    fs.writeFileSync(BOARDS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving data to JSON:', error);
  }
}

// Инициализация при загрузке модуля
initializeStore();

// Функции для работы с досками
export function createBoard(boardData: Omit<Board, 'id'>): Board {
  const board: Board = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    ...boardData,
  };
  boards.push(board);
  saveToFile();
  return board;
}

export function getBoard(id: string): Board | undefined {
  return boards.find((board) => board.id === id);
}

// Функции для работы с голосами
export function addVote(boardId: string, votesObject: Omit<Vote, 'id' | 'boardId'>): Vote {
  const vote: Vote = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    boardId,
    ...votesObject,
  };
  votes.push(vote);
  saveToFile();
  return vote;
}

export function getResults(boardId: string): Vote[] {
  return votes.filter((vote) => vote.boardId === boardId);
}