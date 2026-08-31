import { harvestScore } from "./engine.ts";

export type ComboGuide = {
  name: string;
  how: string;
  pts: string;
};

/** Names match `comboName()`. Points are n² × 10; Mira multiplies by the chain. */
export const COMBO_GUIDE: ComboGuide[] = [
  { name: "Pulso", how: "Una sola ficha.", pts: String(harvestScore(1, 1)) },
  { name: "Eco", how: "Dos del mismo color en cruz.", pts: String(harvestScore(2, 1)) },
  { name: "Acorde", how: "Tres en cruz.", pts: String(harvestScore(3, 1)) },
  { name: "Halo", how: "Cuatro en cruz.", pts: String(harvestScore(4, 1)) },
  {
    name: "Iris",
    how: "Cinco o seis en cruz.",
    pts: `${harvestScore(5, 1)}–${harvestScore(6, 1)}`,
  },
  { name: "Nova", how: "Siete o más en cruz.", pts: `${harvestScore(7, 1)}+` },
  {
    name: "Mira",
    how: "Al caer, cuatro o más iguales en fila o columna.",
    pts: `×2 · ${harvestScore(4, 2)}+`,
  },
];
