import { useId } from "react";

import { adminCurrencyFormatter } from "@/components/admin/AdminPagePrimitives";
import { cn } from "@/lib/utils";

type RevenuePoint = {
  date: string;
  label: string;
  revenue: number;
  orders: number;
};

type AdminRevenueChartProps = {
  data: RevenuePoint[];
  className?: string;
};

const chartWidth = 760;
const chartHeight = 280;
const padding = {
  top: 18,
  right: 18,
  bottom: 38,
  left: 18,
};

const buildLinePath = (points: Array<{ x: number; y: number }>) =>
  points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

const buildAreaPath = (
  points: Array<{ x: number; y: number }>,
  baseline: number
) => {
  if (!points.length) {
    return "";
  }

  return `${buildLinePath(points)} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;
};

export default function AdminRevenueChart({
  data,
  className,
}: AdminRevenueChartProps) {
  const gradientId = useId().replace(/:/g, "");
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const maxRevenue = Math.max(...data.map((point) => point.revenue), 1);
  const maxOrders = Math.max(...data.map((point) => point.orders), 1);
  const xStep = data.length > 1 ? plotWidth / (data.length - 1) : 0;

  const revenuePoints = data.map((point, index) => ({
    x: padding.left + index * xStep,
    y: padding.top + plotHeight - (point.revenue / maxRevenue) * plotHeight,
  }));
  const orderPoints = data.map((point, index) => ({
    x: padding.left + index * xStep,
    y: padding.top + plotHeight - (point.orders / maxOrders) * plotHeight,
  }));
  const revenueAreaPath = buildAreaPath(revenuePoints, padding.top + plotHeight);
  const revenueLinePath = buildLinePath(revenuePoints);
  const orderLinePath = buildLinePath(orderPoints);
  const totalRevenue = data.reduce((sum, point) => sum + point.revenue, 0);
  const totalOrders = data.reduce((sum, point) => sum + point.orders, 0);
  const bestDay = data.reduce<(typeof data)[number] | null>((best, point) => {
    if (!best || point.revenue > best.revenue) {
      return point;
    }

    return best;
  }, null);

  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#1677ff]" />
          Revenus encaisses
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#11b8a5]" />
          Commandes creees
        </span>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-sky-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,249,255,0.9))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="h-[280px] w-full"
          role="img"
          aria-label="Evolution des revenus et des commandes sur 14 jours"
        >
          <defs>
            <linearGradient id={`${gradientId}-area`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#1677ff" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#1677ff" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id={`${gradientId}-orders`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#11b8a5" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#11b8a5" stopOpacity="0" />
            </linearGradient>
          </defs>

          {Array.from({ length: 5 }).map((_, index) => {
            const y = padding.top + (plotHeight / 4) * index;

            return (
              <line
                key={y}
                x1={padding.left}
                x2={chartWidth - padding.right}
                y1={y}
                y2={y}
                stroke="rgba(148, 163, 184, 0.16)"
                strokeDasharray="4 6"
              />
            );
          })}

          {revenuePoints.map((point, index) => (
            <line
              key={data[index]?.date || index}
              x1={point.x}
              x2={point.x}
              y1={padding.top}
              y2={padding.top + plotHeight}
              stroke="rgba(59, 130, 246, 0.08)"
            />
          ))}

          <path d={revenueAreaPath} fill={`url(#${gradientId}-area)`} />
          <path
            d={orderLinePath}
            fill="none"
            stroke="url(#${gradientId}-orders)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 8"
          />
          <path
            d={revenueLinePath}
            fill="none"
            stroke="#1677ff"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {revenuePoints.map((point, index) => (
            <g key={`${data[index]?.date || index}-point`}>
              <circle cx={point.x} cy={point.y} r="5.5" fill="white" />
              <circle cx={point.x} cy={point.y} r="3.5" fill="#1677ff" />
            </g>
          ))}

          {data.map((point, index) =>
            index % 2 === 0 || index === data.length - 1 ? (
              <text
                key={`${point.date}-label`}
                x={padding.left + index * xStep}
                y={chartHeight - 10}
                textAnchor="middle"
                fill="#64748b"
                fontSize="11"
              >
                {point.label}
              </text>
            ) : null
          )}
        </svg>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-[22px] border border-slate-200/80 bg-white/88 px-4 py-3 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.28)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            14 jours
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-950">
            {adminCurrencyFormatter.format(totalRevenue)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Revenus encaisses sur la periode.</p>
        </div>

        <div className="rounded-[22px] border border-slate-200/80 bg-white/88 px-4 py-3 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.28)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Activite
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-950">{totalOrders}</p>
          <p className="mt-1 text-xs text-slate-500">Commandes creees pendant les 14 derniers jours.</p>
        </div>

        <div className="rounded-[22px] border border-slate-200/80 bg-white/88 px-4 py-3 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.28)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Pic journalier
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-950">
            {bestDay ? adminCurrencyFormatter.format(bestDay.revenue) : adminCurrencyFormatter.format(0)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {bestDay ? `Meilleure journee: ${bestDay.label}.` : "Aucune activite recente."}
          </p>
        </div>
      </div>
    </div>
  );
}
