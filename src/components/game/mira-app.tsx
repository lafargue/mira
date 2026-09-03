import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  HelpCircle,
  Infinity,
  RotateCcw,
  Settings2,
  Share2,
  Trophy,
  Volume2,
  VolumeX,
  Wand2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardView, ColorLegend, ComboGuide, GlyphLegend, HelpDiagram } from "@/components/game/board";
import { AuthChip } from "@/components/game/auth-chip";
import { Ranking } from "@/components/game/ranking";
import { Settings } from "@/components/game/settings";
import {
  DAILY_MOVES,
  PRESSURE_MAX,
  applyPulse,
  createGame,
  previewHarvest,
  pulse,
  pulseGlyph,
  type GameState,
  type Harvested,
  type Mode,
  type Pos,
  type PulseResult,
} from "@/lib/game/engine";
import { dailyNumber, dailySeed, utcDateKey } from "@/lib/game/rng";
import { loadStats, saveStats, streakAfterPlay, type Stats } from "@/lib/game/save";
import { renderGlyphGrid, shareOrCopy, shareText } from "@/lib/game/share";
import { submitScore } from "@/lib/game/scores";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  playEvolve,
  playGameOver,
  playHarvest,
  playTap,
  playWin,
  setMuted,
  unlockAudio,
} from "@/lib/game/audio";
import { cn } from "@/lib/utils";
import { restorePreviewSession } from "@/lib/session-persist";
import { usePrefs } from "@/lib/prefs-context";
import { useCredits } from "@/lib/game/use-credits";
import { TIP_COST } from "@/lib/game/wallet";
import { bestTap } from "@/lib/game/hint";

restorePreviewSession();

type Screen = "menu" | "play" | "help" | "ranking" | "settings";
