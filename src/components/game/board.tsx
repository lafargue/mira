import { cn } from "@/lib/utils";
import { SIZE, type Board, type Color, type Harvested, type Pos } from "@/lib/game/engine";

const TILE_BG: Record<Color, string> = {
  0: "bg-tile-a",
  1: "bg-tile-b",
  2: "bg-tile-c",
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
            return (
              <button
                key={tile ? `t-${tile.id}` : `e-${r}-${c}`}
                type="button"
                data-r={r}
                data-c={c}
                disabled={locked || !tile}
                aria-label={tile ? `Ficha ${r + 1}, ${c + 1}` : undefined}
                className={cn(
                  "relative min-h-11 min-w-11 overflow-hidden rounded-lg transition-[transform,box-shadow,opacity] duration-150 ease-out",
                  tile ? TILE_BG[tile.color] : "bg-surface-2",
                  isHarvest && "ring-2 ring-accent scale-[1.04] z-10",
                  isWall && "ring-2 ring-fg/40",
                  onCross && !isHarvest && !isWall && "brightness-110",
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
                {tile ? <span className="flex size-full items-center justify-center"><Shape color={tile.color} /></span> : null}
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
    <div className="flex items-center justify-center gap-4 text-subtle">
      {([0, 1, 2] as Color[]).map((c) => (
        <span key={c} className={cn("flex size-6 items-center justify-center rounded-md", TILE_BG[c])}>
          <Shape color={c} />
        </span>
      ))}
    </div>
  );
}
