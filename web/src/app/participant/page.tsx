import { Suspense } from "react";
import { ParticipantPage } from "@/views/participant-page";

export default function Participant() {
  return (
    <Suspense fallback={<p className="message">読み込み中…</p>}>
      <ParticipantPage />
    </Suspense>
  );
}
