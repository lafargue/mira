import { cn } from "@/lib/utils";
import { SIZE, type Board, type Color, type Harvested, type Pos } from "@/lib/game/engine";
import { COMBO_GUIDE } from "@/lib/game/combos";
import { GLYPH_GUIDE } from "@/lib/game/share";

const TILE_BG: Record<Color, string> = {
  0: "bg-tile-a",
  1: "bg-tile-b",
  2: "bg-tile-c",
};

const COLOR_NAME: Record<Color, string> = {
  0: "Rosa",
  1: "Verde",
  2: "Azul",
};

function Shape({ color }: { color: Color }) {
  if (color === 0) {
    return <span className="tile-shape size-[46%] rounded-full" />;
  }
  if (color === 1) {
    return <span className="tile-shape size-[42%] rounded-[5px]" />;
  }
  return <span className="tile-shape size-[40%] rotate-45 rounded-[4px]" />;
}

type BoardViewProps = {
  board: Board;
  preview?: { harvested: Harvested[]; walls: Pos[]; row: number; col: number } | null;
  poppingIds?: Set<number>;
  spawnIds?: Set<number>;
  shake?: boolean;
  locked?: boolean;
  hint?: Pos | null;
  onCellDown: (r: number, c: number) => void;
  onCellUp: (r: number, c: number) => void;
  onCancel: () => void;
};

export function BoardView({
  board,
  preview,
  poppingIds,
  spawnIds,
  shake,
  locked,
  hint,
  onCellDown,
  onCellUp,
  onCancel,
}: BoardViewProps) {
  const harvestSet = new Set((preview?.harvested ?? []).map((h) => `${h.r},${h.c}`));
  const wallSet = new Set((preview?.walls ?? []).map((w) => `${w.r},${w.c}`));

  return (
    <div
      data-testid="mira-board"
      className={cn(
        "relative mx-auto aspect-square w-full max-w-[min(100%,28rem)] rounded-2xl border border-border bg-surface p-2",
        shake && "board-shake",
      )}
      onPointerLeave={onCancel}
      onPointerCancel={onCancel}
    >
      <div
        className="grid h-full w-full gap-1.5"
        style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}
      >
        {board.map((row, r) =>
          row.map((tile, c) => {
            const key = `${r},${c}`;
            const onCross = preview && (r === preview.row || c === preview.col);
            const isHarvest = harvestSet.has(key);
            const isWall = wallSet.has(key);
            const popping = tile ? poppingIds?.has(tile.id) : false;
            const spawning = tile ? spawnIds?.has(tile.id) : false;
            const isHint = Boolean(hint && hint.r === r && hint.c === c && !preview);
            return (
              <button
                key={tile ? `t-${tile.id}` : `e-${r}-${c}`}
                type="button"
                data-r={r}
                data-c={c}
                disabled={locked || !tile}
                aria-label={tile ? `Ficha ${COLOR_NAME[tile.color]} ${r + 1}, ${c + 1}` : undefined}
                className={cn(
                  "relative min-h-11 min-w-11 overflow-hidden rounded-lg transition-[transform,box-shadow,opacity] duration-150 ease-out",
                  tile ? TILE_BG[tile.color] : "bg-surface-2",
                  isHarvest && "ring-2 ring-accent scale-[1.04] z-10",
                  isWall && "ring-2 ring-fg/40",
                  onCross && !isHarvest && !isWall && "brightness-110",
                  isHint && "tile-hint z-10",
                  popping && "tile-pop pointer-events-none",
                  spawning && "tile-spawn",
                )}
                onPointerDown={(e) => {
                  if (locked || !tile) return;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  onCellDown(r, c);
                }}
                onPointerUp={() => onCellUp(r, c)}
              >
                {tile ? (
                  <span className="flex size-full items-center justify-center">
                    <Shape color={tile.color} />
                  </span>
                ) : null}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}

export function ColorLegend() {
  return (
    <div className="flex items-center justify-center gap-4">
      {([0, 1, 2] as Color[]).map((c) => (
        <span key={c} className="flex items-center gap-1.5 text-xs text-muted">
          <span className={cn("flex size-6 items-center justify-center rounded-md", TILE_BG[c])}>
            <Shape color={c} />
          </span>
          {COLOR_NAME[c]}
        </span>
      ))}
    </div>
  );
}

type DemoCell = { color: Color; role: "tap" | "eat" | "wall" } | null;

const DEMO: DemoCell[][] = [
  [null, null, { color: 0, role: "eat" }, null, null],
  [
    { color: 1, role: "wall" },
    { color: 0, role: "eat" },
    { color: 0, role: "tap" },
    { color: 0, role: "eat" },
    { color: 1, role: "wall" },
  ],
  [null, null, { color: 0, role: "eat" }, null, null],
];

export function HelpDiagram() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div
        className="mx-auto grid w-full max-w-[14rem] gap-1.5"
        style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}
        aria-hidden="true"
      >
        {DEMO.flatMap((row, r) =>
          row.map((cell, c) => (
            <span
              key={`${r}-${c}`}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md",
                cell ? TILE_BG[cell.color] : "bg-surface-2",
                cell?.role === "tap" && "ring-2 ring-accent",
                cell?.role === "eat" && "ring-2 ring-accent/50",
                cell?.role === "wall" && "ring-2 ring-fg/40",
              )}
            >
              {cell ? <Shape color={cell.color} /> : null}
            </span>
          )),
        )}
      </div>
      <p className="mt-3 text-center text-xs leading-relaxed text-muted">
        Tocas el rosa del centro. Se van los rosas de la cruz. Los verdes (el muro) cambian a azul.
      </p>
    </div>
  );
}

export function ComboGuide() {
  return (
    <div>
      <h3 className="font-medium text-fg">Las jugadas</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Los puntos son fichas × fichas × 10. No puede haber cuatro en línea al tocar: eso ya habría estallado al caer (Mira). El toque más gordo es cinco.
      </p>
      <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-surface">
        {COMBO_GUIDE.map((c) => (
          <li key={c.name} className="flex items-baseline gap-3 px-4 py-2.5 text-sm">
            <span className="w-20 shrink-0 font-medium text-fg">{c.name}</span>
            <span className="min-w-0 flex-1 text-muted">{c.how}</span>
            <span className="shrink-0 tabular-nums text-fg">{c.pts}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GlyphLegend({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="mt-2 text-center text-xs leading-relaxed text-muted">
        <p>Cada signo es un pulso, de izquierda a derecha.</p>
        <p className="mt-1 text-subtle">
          {GLYPH_GUIDE.map((g) => `${g.glyph} ${g.short}`).join(" · ")}
        </p>
      </div>
    );
  }
  return (
    <div>
      <h3 className="font-medium text-fg">Los signos del diario</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Al terminar ves 12 signos: un pulso cada uno, de izquierda a derecha. El cuadrado hueco es el toque más flojo; el rombo es una Mira.
      </p>
      <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-surface">
        {GLYPH_GUIDE.map((g) => (
          <li key={g.glyph} className="flex items-baseline gap-3 px-4 py-2.5 text-sm">
            <span className="w-6 shrink-0 text-center text-fg">{g.glyph}</span>
            <span className="w-32 shrink-0 font-medium text-fg">{g.name}</span>
            <span className="min-w-0 flex-1 text-muted">{g.how}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
