export type Me = {
  id: number;
  email: string;
};

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
  observerPasscode?: string | null;
  status: "READY" | "RUNNING" | "FINISHED";
  matches: Match[];
};
export type TournamentParticipant = {
  id: number;
  name: string;
  initialPosition: number | null;
};

export type PublicState = {
  participants: Array<{
    id: number;
    name: string;
  }>;
  activeTournaments: Tournament[];
};

export type AuthMode = "none" | "signup" | "login"; // 認証モード(モーダルの表示管理)
