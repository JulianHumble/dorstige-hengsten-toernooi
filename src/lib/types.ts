export type SessionStatus = 'lobby' | 'active' | 'reveal' | 'finished';

export interface Session {
  id: string;
  code: string;
  host_name: string;
  status: SessionStatus;
  current_beer: number | null;
  created_at: string;
}

export interface Beer {
  id: string;
  session_id: string;
  order_number: number;
  brewery: string;
  beer_name: string;
  description: string;
  revealed: boolean;
}

export interface Participant {
  id: string;
  session_id: string;
  name: string;
  is_host: boolean;
  joined_at: string;
}

export interface Guess {
  id: string;
  participant_id: string;
  beer_id: string;
  guessed_beer_id: string;
  rating: number | null;
  is_correct: boolean;
  submitted_at: string;
}

export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: Session;
        Insert: Omit<Session, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<Session, 'id'>>;
      };
      beers: {
        Row: Beer;
        Insert: Omit<Beer, 'id'> & { id?: string };
        Update: Partial<Omit<Beer, 'id'>>;
      };
      participants: {
        Row: Participant;
        Insert: Omit<Participant, 'id' | 'joined_at'> & { id?: string; joined_at?: string };
        Update: Partial<Omit<Participant, 'id'>>;
      };
      guesses: {
        Row: Guess;
        Insert: Omit<Guess, 'id' | 'is_correct' | 'submitted_at'> & { id?: string; submitted_at?: string };
        Update: Partial<Omit<Guess, 'id' | 'is_correct'>>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      session_status: SessionStatus;
    };
  };
}
