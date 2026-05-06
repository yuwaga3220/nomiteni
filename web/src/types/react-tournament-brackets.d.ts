declare module "@g-loot/react-tournament-brackets" {
  import type { ComponentType } from "react";

  type TournamentTheme = {
    textColor: { main: string; highlighted: string; dark: string };
    matchBackground: { wonColor: string; lostColor: string };
    score: {
      background: { wonColor: string; lostColor: string };
      text: { highlightedWonColor: string; highlightedLostColor: string };
    };
    border: { color: string; highlightedColor: string };
    roundHeaders: { background: string };
    connectorColor: string;
    connectorColorHighlight: string;
    canvasBackground: string;
  };

  export const SingleEliminationBracket: ComponentType<Record<string, unknown>>;
  export const DoubleEliminationBracket: ComponentType<Record<string, unknown>>;
  export const Match: ComponentType<Record<string, unknown>>;
  export const SVGViewer: ComponentType<Record<string, unknown>>;
  export function createTheme(theme: TournamentTheme): TournamentTheme;
  export const MATCH_STATES: Record<string, string>;
}
