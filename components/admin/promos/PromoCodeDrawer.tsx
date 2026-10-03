"use client";

import { Dice5, X } from "lucide-react";
import { useActionState, useState } from "react";

import {
  savePromoCodeState,
  type PromoMutationState,
} from "@/app/admin/promos/actions";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { AdminPromoCodeItem } from "@/lib/promos/admin-data";
import { cn } from "@/lib/utils";

const initialState: PromoMutationState = { success: false, message: "", revision: 0 };
const dateInput = (value: string | null) => (value ? value.slice(0, 10) : "");

export default function PromoCodeDrawer({
  open,
  promo,
  mode,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  promo: AdminPromoCodeItem | null;
  mode: "create" | "edit";
  onOpenChange: (open: boolean) => void;
  onSaved: (message: string) => void;
}) {
  const [code, setCode] = useState(promo?.code || "");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    promo?.discountType || "percentage"
  );
  const [state, formAction] = useActionState(
    async (previous: PromoMutationState, formData: FormData) => {
      const next = await savePromoCodeState(previous, formData);
      if (next.success) {
        onOpenChange(false);
        onSaved(next.message);
      }
      return next;
    },
    initialState
  );

  const generateCode = () => {
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    setCode(`ZAYNA-${suffix}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-slate-950/20 backdrop-blur-[1px]"
        className="!bottom-0 !left-auto !right-0 !top-0 flex !h-dvh !w-full !max-w-none !translate-x-0 !translate-y-0 flex-col gap-0 overflow-hidden !rounded-none border-y-0 border-r-0 border-l border-slate-200 bg-slate-50 p-0 shadow-2xl sm:!max-w-xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 sm:px-7">
          <div>
            <DialogTitle className="text-xl text-slate-950">
              {mode === "create"
                ? "Ajouter un code promo"
                : `Modifier le code promo — ${promo?.code || ""}`}
            </DialogTitle>
            <DialogDescription className="mt-2 leading-5">
              Configurez la remise, sa période et ses règles d&apos;utilisation.
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <Button type="button" variant="ghost" size="icon-sm" className="rounded-xl" aria-label="Fermer le formulaire">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </header>

        <form action={formAction} className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          {promo ? <input type="hidden" name="id" value={promo.id} /> : null}
          <div className="space-y-5">
            <label className="block text-sm font-semibold text-slate-800">
              Nom / campagne
              <Input name="title" required defaultValue={promo?.title || ""} placeholder="Ex : Offre Ramadan" className="mt-2 h-11 rounded-2xl bg-white" />
            </label>

            <label className="block text-sm font-semibold text-slate-800">
              Code
              <div className="mt-2 flex gap-2">
                <Input name="code" required value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="RAMADAN15" className="h-11 rounded-2xl bg-white font-mono" />
                <Button type="button" variant="outline" onClick={generateCode} className="h-11 shrink-0 rounded-2xl bg-white"><Dice5 className="h-4 w-4" />Générer</Button>
              </div>
              <span className="mt-1 block text-xs font-normal text-slate-500">Le code est normalisé et son unicité est vérifiée côté serveur.</span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-800">
                Type de remise
                <select name="discountType" value={discountType} onChange={(event) => setDiscountType(event.target.value as "percentage" | "fixed")} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm">
                  <option value="percentage">Pourcentage</option>
                  <option value="fixed">Montant fixe</option>
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-800">
                Valeur {discountType === "percentage" ? "(%)" : "(MAD)"}
                <Input name="discountValue" type="number" required min="0.01" max={discountType === "percentage" ? "100" : undefined} step="0.01" defaultValue={promo?.discountValue || ""} className="mt-2 h-11 rounded-2xl bg-white" />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-800">Date de début<Input name="startsAt" type="date" defaultValue={dateInput(promo?.startsAt || null)} className="mt-2 h-11 rounded-2xl bg-white" /></label>
              <label className="block text-sm font-semibold text-slate-800">Date de fin<Input name="endsAt" type="date" defaultValue={dateInput(promo?.endsAt || null)} className="mt-2 h-11 rounded-2xl bg-white" /></label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-800">Minimum de commande (MAD)<Input name="minimumOrderAmount" type="number" min="0" step="0.01" defaultValue={promo?.minimumOrderAmount ?? 0} className="mt-2 h-11 rounded-2xl bg-white" /></label>
              <label className="block text-sm font-semibold text-slate-800">Limite d&apos;utilisation<Input name="usageLimit" type="number" min={Math.max(1, promo?.usedCount || 1)} step="1" defaultValue={promo?.usageLimit ?? ""} placeholder="Sans limite" className="mt-2 h-11 rounded-2xl bg-white" />{promo ? <span className="mt-1 block text-xs font-normal text-slate-500">{promo.usedCount} utilisation(s) enregistrée(s)</span> : null}</label>
            </div>

            <fieldset className="rounded-2xl border border-slate-200 bg-white p-4">
              <legend className="px-1 text-sm font-semibold text-slate-800">Moyens de paiement autorisés</legend>
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                {([['cod','Paiement à la livraison'],['cmi_card','Carte bancaire'],['installments','Plusieurs fois']] as const).map(([value, label]) => (
                  <label key={value} className="flex items-start gap-2 text-xs text-slate-700"><input type="checkbox" name="allowedPaymentMethods" value={value} defaultChecked={!promo || promo.allowedPaymentMethods.includes(value)} className="mt-0.5 h-4 w-4 rounded border-slate-300" /><span>{label}</span></label>
                ))}
              </div>
            </fieldset>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              <input type="checkbox" name="active" defaultChecked={promo?.active ?? true} className="h-4 w-4 rounded border-slate-300 text-shop_btn_dark_green" />
              Activer manuellement ce code
            </label>

            {state.message && !state.success ? <p role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.message}</p> : null}
          </div>

          <div className="sticky bottom-0 mt-6 flex justify-end gap-2 border-t border-slate-200 bg-slate-50 py-4">
            <DialogClose asChild><Button type="button" variant="outline" className="rounded-xl bg-white">Annuler</Button></DialogClose>
            <AdminSubmitButton pendingLabel="Enregistrement…" className={cn("rounded-xl bg-shop_btn_dark_green text-white hover:bg-shop_dark_green")}>{mode === "create" ? "Ajouter le code" : "Enregistrer"}</AdminSubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
