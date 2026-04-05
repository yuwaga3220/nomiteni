/**
 * 管理者ページ
 */
"use client";

import { useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminManagementSection, AdminMatchesSection, RealtimeSection, UserMenuSection } from "@/components/AppSections";
import { useNomiteni } from "@/context/NomiteniContext";
import { api } from "@/lib/api";

export function AdminPage() {
  const router = useRouter();
  const {
    me,
    forceLoginCardsView,
    entryTournament,
    entryName,
    setEntryName,
    entryParty,
    setEntryParty,
    entryNote,
    setEntryNote,
    entryPasscode,
    state,
    active,
    tournamentName,
    setTournamentName,
    tournamentDate,
    setTournamentDate,
    tournamentTimeSlot,
    setTournamentTimeSlot,
    courtCountInput,
    setCourtCountInput,
    observerSetPasscode,
    setObserverSetPasscode,
    entrySetPasscode,
    setEntrySetPasscode,
    checkinState,
    assignableMatches,
    playerName,
    groupedRounds,
    matchStatusLabel,
    call,
  } = useNomiteni();

  const allowed = Boolean(me && !forceLoginCardsView && me.role === "ADMIN");

  useLayoutEffect(() => {
    if (!allowed) router.replace("/");
  }, [allowed, router]);

  if (!allowed || !me) return null;

  return (
    <>
      <UserMenuSection
        me={me}
        entryTournament={entryTournament}
        entryName={entryName}
        setEntryName={setEntryName}
        entryParty={entryParty}
        setEntryParty={setEntryParty}
        entryNote={entryNote}
        setEntryNote={setEntryNote}
        onEntrySubmit={() =>
          call(() =>
            api("/api/entry/self", {
              method: "POST",
              body: JSON.stringify({
                tournamentPasscode: entryPasscode,
                name: entryName,
                partyJoin: entryParty,
                note: entryNote || undefined,
              }),
            }),
          )
        }
        onCheckinJoin={() => call(() => api("/api/checkin/self", { method: "POST", body: JSON.stringify({ canPlayToday: true }) }))}
        onCheckinAbsent={() => call(() => api("/api/checkin/self", { method: "POST", body: JSON.stringify({ canPlayToday: false }) }))}
        onLogout={() => call(() => api("/api/auth/logout", { method: "POST" }))}
      />
      <AdminManagementSection
        active={active}
        state={state}
        tournamentName={tournamentName}
        setTournamentName={setTournamentName}
        tournamentDate={tournamentDate}
        setTournamentDate={setTournamentDate}
        tournamentTimeSlot={tournamentTimeSlot}
        setTournamentTimeSlot={setTournamentTimeSlot}
        courtCountInput={courtCountInput}
        setCourtCountInput={setCourtCountInput}
        observerSetPasscode={observerSetPasscode}
        setObserverSetPasscode={setObserverSetPasscode}
        entrySetPasscode={entrySetPasscode}
        setEntrySetPasscode={setEntrySetPasscode}
        checkinState={checkinState}
        onSaveTournamentSettings={() =>
          call(() =>
            api("/api/admin/tournaments/settings", {
              method: "POST",
              body: JSON.stringify({
                name: tournamentName,
                eventDate: tournamentDate || null,
                timeSlot: tournamentTimeSlot || null,
                courtCount: courtCountInput,
                entryPasscode: entrySetPasscode,
                observerPasscode: observerSetPasscode,
              }),
            }),
          )
        }
        onSetReady={(id: number) =>
          call(() =>
            api(`/api/admin/participants/${id}/checkin`, {
              method: "POST",
              body: JSON.stringify({ checkedIn: true, canPlayToday: true }),
            }),
          )
        }
        onSetAbsent={(id: number) =>
          call(() =>
            api(`/api/admin/participants/${id}/checkin`, {
              method: "POST",
              body: JSON.stringify({ checkedIn: true, canPlayToday: false }),
            }),
          )
        }
        onSetUnanswered={(id: number) =>
          call(() =>
            api(`/api/admin/participants/${id}/checkin`, {
              method: "POST",
              body: JSON.stringify({ checkedIn: false, canPlayToday: null }),
            }),
          )
        }
      />
      {active && (
        <AdminMatchesSection
          state={state}
          matches={assignableMatches}
          playerName={playerName}
          onAssignCourt={(matchId, courtNumber) =>
            call(() =>
              api(`/api/admin/matches/${matchId}/assign`, {
                method: "POST",
                body: JSON.stringify({ courtNumber }),
              }),
            )
          }
          onStart={(matchId) => call(() => api(`/api/admin/matches/${matchId}/start`, { method: "POST" }))}
          onWin={(matchId, winnerId) =>
            call(() =>
              api(`/api/admin/matches/${matchId}/result`, {
                method: "POST",
                body: JSON.stringify({ winnerId }),
              }),
            )
          }
        />
      )}
      <RealtimeSection
        active={active}
        state={state}
        groupedRounds={groupedRounds}
        playerName={playerName}
        matchStatusLabel={matchStatusLabel}
      />
    </>
  );
}
