/**
 * 型定義
 */
export type Role = "LOGIN" |"PARTICIPANT" | "ADMIN" | "OBSERVER";

export type User = {
  id: number;
  name: string | null;
  checkedIn: boolean;
  canPlayToday: boolean | null;
  partyJoin: boolean;
  note: string | null;
};

export type Me = User & { email: string; role: Role };

export type Match = {
  id: number;
  tournamentId: number;
  round: number;
  position: number;
  player1Id: number | null;
  player2Id: number | null;
  winnerId: number | null;
  status: "READY" | "RUNNING" | "FINISHED";
  courtNumber: number | null;
};

export type Tournament = {
  id: number;
  name: string;
  eventDate?: string | null;
  timeSlot?: string | null;
  courtCount?: number;
  entryPasscode?: string | null;
  observerPasscode?: string | null;
  status: "ENTRY" | "READY" | "RUNNING" | "FINISHED";
  matches: Match[];
};
export type TournamentBrief = {
  id: number;
  name: string;
  eventDate?: string | null;
  timeSlot?: string | null;
  courtCount?: number;
  entryPasscode?: string | null;
  observerPasscode?: string | null;
  status: "ENTRY" | "READY" | "RUNNING" | "FINISHED";
};

export type TournamentParticipant = {
  userId: number;
  name: string;
  initialPosition: number | null;
};

export type PublicState = {
  users: User[];
  activeTournaments: Tournament[];
};

export type CheckinState = "UNANSWERED" | "READY" | "ABSENT";
export type AuthMode = "none" | "signup" | "login"; // 認証モード(モーダルの表示管理)
