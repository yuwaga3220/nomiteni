export type Role = "PARTICIPANT" | "ADMIN" | "OBSERVER";

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
  status: "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED";
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
  status: string;
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
  status: string;
};

export type PublicState = {
  users: User[];
  activeTournament: Tournament | null;
  courtCount: number;
};

export type CheckinState = "UNANSWERED" | "READY" | "ABSENT";
export type AuthMode = "none" | "signup" | "login";
