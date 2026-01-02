export enum UserRole {
  STUDENT = 'élève',
  DELEGATE = 'délégué',
  ADMIN = 'admin'
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface Message {
  id: string;
  user_id: string;
  profile?: { name: string; role: string };
  content: string;
  created_at: string;
  is_mandarin?: boolean;
  pinyin?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'NORMAL' | 'URGENT';
  imageUrl?: string;
  created_at: string;
}

export interface ScheduleItem {
  id: string;
  day: string;
  time: string;
  subject: string;
  room: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QuizResult {
  id: string;
  user_id: string;
  score: number;
  total: number;
  created_at: string;
}

export interface TranslationResponse {
  hanzi: string;
  pinyin: string;
}