type SectionOrderControlsProps = {
  sectionId: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  action: (formData: FormData) => void | Promise<void>;
};

export default function SectionOrderControls({
  sectionId,
  canMoveUp,
  canMoveDown,
  action,
}: SectionOrderControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <form action={action}>
        <input type="hidden" name="id" value={sectionId} />
        <input type="hidden" name="direction" value="up" />
        <button
          type="submit"
          disabled={!canMoveUp}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition-colors hover:border-shop_btn_dark_green hover:text-shop_btn_dark_green disabled:cursor-not-allowed disabled:opacity-40"
        >
          ↑
        </button>
      </form>
      <form action={action}>
        <input type="hidden" name="id" value={sectionId} />
        <input type="hidden" name="direction" value="down" />
        <button
          type="submit"
          disabled={!canMoveDown}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition-colors hover:border-shop_btn_dark_green hover:text-shop_btn_dark_green disabled:cursor-not-allowed disabled:opacity-40"
        >
          ↓
        </button>
      </form>
    </div>
  );
}
