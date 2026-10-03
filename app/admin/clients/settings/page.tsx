import { AlertTriangle } from "lucide-react";
import { expireLoyaltyPointsAction } from "@/app/admin/clients/actions";

import ClientsPageHeader from "@/components/admin/clients/ClientsPageHeader";
import LoyaltyAuditHistory from "@/components/admin/clients/LoyaltyAuditHistory";
import { AddRewardButton, LoyaltySettingsForm, RewardEditor } from "@/components/admin/clients/LoyaltySettingsForms";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { getLoyaltyConfiguration } from "@/lib/services/loyalty";
import { getLoyaltyAuditHistory } from "@/lib/services/loyalty-audit";

export default async function LoyaltySettingsPage() {
  const identity = await requireAdmin();
  const [{ settings, tierRules }, rewards, audit] = await Promise.all([
    getLoyaltyConfiguration(),
    prisma.loyaltyReward.findMany({ where: { archivedAt: null }, orderBy: { pointsCost: "asc" } }),
    getLoyaltyAuditHistory(identity),
  ]);
  return <div className="space-y-5"><ClientsPageHeader description="Configurez les statuts, l’expiration, les segments et le catalogue de récompenses. Chaque changement important est audité." actions={<form action={expireLoyaltyPointsAction}><button className="h-10 rounded-xl border border-orange-200 bg-white px-4 text-xs font-semibold text-orange-700">Traiter les expirations dues</button></form>} />
    <div className="grid gap-5 xl:grid-cols-[1.6fr_.8fr]"><LoyaltySettingsForm settings={settings} tierRules={tierRules} /><aside className="space-y-4"><section className="rounded-[24px] border border-amber-200 bg-amber-50/70 p-5"><h2 className="flex items-center gap-2 text-sm font-bold text-amber-900"><AlertTriangle className="h-4 w-4" /> Modification de règle majeure</h2><p className="mt-2 text-xs leading-5 text-amber-800">Les nouvelles règles s’appliquent aux gains et qualifications futurs. Le grand livre historique reste immuable.</p></section><LoyaltyAuditHistory items={audit} /></aside></div>
    <section id="rewards" className="scroll-mt-24 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_16px_50px_-42px_rgba(15,23,42,0.4)]"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-bold text-[#0f1d42]">Catalogue des récompenses</h2><p className="mt-1 text-xs text-slate-500">Ajoutez, modifiez, désactivez ou archivez les avantages échangeables.</p></div><AddRewardButton /></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{rewards.map((reward) => <RewardEditor key={reward.id} reward={{ id: reward.id, name: reward.name, description: reward.description, type: reward.type, pointsCost: reward.pointsCost, monetaryValue: reward.monetaryValue ? Number(reward.monetaryValue) : null, percentageValue: reward.percentageValue, isActive: reward.isActive }} />)}</div></section>
  </div>;
}
