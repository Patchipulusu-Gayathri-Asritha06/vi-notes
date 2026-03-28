export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Session {
  _id: string;
  userId: string;
  title: string;
  content: string;
  wordCount: number;
  characterCount: number;
  duration: number;
  createdAt: string;
  updatedAt: string;
}

export interface SessionListItem {
  _id: string;
  title: string;
  wordCount: number;
  characterCount: number;
  duration: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  message: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface SaveSessionPayload {
  title: string;
  content: string;
  wordCount: number;
  characterCount: number;
  duration: number;
}
