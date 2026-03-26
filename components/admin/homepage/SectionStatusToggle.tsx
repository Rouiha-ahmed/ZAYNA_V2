type SectionStatusToggleProps = {
  sectionId: string;
  isActive: boolean;
  action: (formData: FormData) => void | Promise<void>;
};

export default function SectionStatusToggle({
  sectionId,
  isActive,
  action,
}: SectionStatusToggleProps) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={sectionId} />
      <input type="hidden" name="isActive" value={isActive ? "0" : "1"} />
      <button
        type="submit"
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
          isActive
            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
            : "bg-slate-100 text-slate-700 ring-slate-200"
        }`}
      >
        {isActive ? "Actif" : "Inactif"}
      </button>
    </form>
  );
}
