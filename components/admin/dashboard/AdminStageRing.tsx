import { cn } from "@/lib/utils";

type StageItem = {
  status: string;
  label: string;
  count: number;
};

type AdminStageRingProps = {
  data: StageItem[];
  className?: string;
};

const stagePalette = [
  {
    solid: "#1677ff",
    soft: "bg-sky-50 text-sky-700 ring-sky-200",
    track: "bg-sky-500",
  },
  {
    solid: "#00a6a6",
    soft: "bg-teal-50 text-teal-700 ring-teal-200",
    track: "bg-teal-500",
  },
  {
    solid: "#10b981",
    soft: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    track: "bg-emerald-500",
  },
  {
    solid: "#7c69ee",
    soft: "bg-violet-50 text-violet-700 ring-violet-200",
    track: "bg-violet-500",
  },
  {
    solid: "#f59e0b",
    soft: "bg-amber-50 text-amber-700 ring-amber-200",
    track: "bg-amber-500",
  },
  {
    solid: "#ef4444",
    soft: "bg-rose-50 text-rose-700 ring-rose-200",
    track: "bg-rose-500",
  },
] as const;

export default function AdminStageRing({
  data,
  className,
}: AdminStageRingProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  let currentStop = 0;

  const conicGradient =
    total > 0
      ? `conic-gradient(${data
          .map((item, index) => {
            const nextStop = currentStop + (item.count / total) * 100;
            const segment = `${stagePalette[index % stagePalette.length].solid} ${currentStop}% ${nextStop}%`;

            currentStop = nextStop;

            return segment;
          })
          .join(", ")})`
      : "conic-gradient(#e2e8f0 0% 100%)";

  const leadStage = data.reduce<StageItem | null>((best, item) => {
    if (!best || item.count > best.count) {
      return item;
    }

    return best;
  }, null);

  return (
    <div className={cn("grid gap-6 lg:grid-cols-[190px_minmax(0,1fr)]", className)}>
      <div className="flex flex-col items-center justify-center gap-4">
        <div
          className="flex h-44 w-44 items-center justify-center rounded-full p-[14px] shadow-[0_30px_70px_-44px_rgba(15,23,42,0.4)]"
          style={{ backgroundImage: conicGradient }}
        >
          <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-white/70 bg-white/96 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
            <span className="text-3xl font-semibold tracking-tight text-slate-950">{total}</span>
            <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              commandes
            </span>
          </div>
        </div>

        <div className="rounded-[20px] border border-slate-200 bg-slate-50/90 px-4 py-3 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Etape dominante
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {leadStage ? leadStage.label : "Aucune activite"}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
          const palette = stagePalette[index % stagePalette.length];

          return (
            <div
              key={item.status}
              className="rounded-[24px] border border-slate-200/80 bg-white/92 p-4 shadow-[0_22px_44px_-34px_rgba(15,23,42,0.28)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{item.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{percentage}% du flux total</p>
                </div>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                    palette.soft
                  )}
                >
                  {item.count}
                </span>
              </div>
              <div className="mt-3 h-2.5 rounded-full bg-slate-100">
                <div
                  className={cn("h-full rounded-full", palette.track)}
                  style={{ width: `${Math.max(percentage, item.count > 0 ? 10 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
