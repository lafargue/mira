import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColorLegend, ComboGuide, GlyphLegend, HelpDiagram } from "@/components/game/board";
import { usePrefs } from "@/lib/prefs-context";

export function Help({ onClose }: { onClose: () => void }) {
  const { t } = usePrefs();
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between">
        <h2 className="font-display text-2xl">{t.howToPlay}</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex size-11 items-center justify-center rounded-lg text-muted hover:text-fg"
          aria-label={t.close}
        >
          <X className="size-5" />
        </button>
      </header>

      <div className="mt-5 flex flex-col gap-6 pb-4">
        <HelpDiagram />
        <ol className="flex flex-col gap-5 text-sm leading-relaxed text-muted">
          <li>
            <span className="block font-medium text-fg">{t.help1Title}</span>
            {t.help1Body}
          </li>
          <li>
            <span className="block font-medium text-fg">{t.help2Title}</span>
            {t.help2Body}
          </li>
          <li>
            <span className="block font-medium text-fg">{t.help3Title}</span>
            {t.help3Body}
          </li>
          <li>
            <span className="block font-medium text-fg">{t.help4Title}</span>
            {t.help4Body}
          </li>
        </ol>
        <ComboGuide />
        <GlyphLegend />
        <ColorLegend />
      </div>

      <div className="sticky bottom-0 mt-auto bg-bg pt-3">
        <Button className="w-full rounded-xl" onClick={onClose}>
          {t.play}
        </Button>
      </div>
    </div>
  );
}

export function Tutorial({ onBack, onPlay }: { onBack: () => void; onPlay: () => void }) {
  const { t } = usePrefs();
  return (
    <div className="flex flex-1 flex-col" data-testid="mira-tutorial">
      <header className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex size-11 items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:text-fg"
          aria-label={t.back}
        >
          <ArrowLeft className="size-5" strokeWidth={1.75} />
        </button>
        <h2 className="font-display text-2xl tracking-tight">{t.howToPlay}</h2>
      </header>

      <div className="mt-5 flex flex-col gap-6 pb-4">
        <HelpDiagram />
        <ol className="flex flex-col gap-4 text-sm leading-relaxed text-muted">
          <li>
            <span className="font-medium text-fg">{t.tut1}</span> {t.tut1b}
          </li>
          <li>
            <span className="font-medium text-fg">{t.tut2}</span> {t.tut2b}
          </li>
          <li>
            <span className="font-medium text-fg">{t.tut3}</span> {t.tut3b}
          </li>
        </ol>
        <ComboGuide />
      </div>

      <div className="sticky bottom-0 mt-auto bg-bg pt-3">
        <Button className="w-full rounded-xl" onClick={onPlay}>
          {t.tap}
        </Button>
      </div>
    </div>
  );
}
