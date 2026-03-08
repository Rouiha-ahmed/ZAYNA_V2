"use client";

import type { MouseEvent, ReactNode } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminDeleteButtonProps = {
  children?: ReactNode;
  confirmMessage: string;
  pendingLabel?: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "xs" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";
};

const AdminDeleteButton = ({
  children = "Supprimer",
  confirmMessage,
  pendingLabel = "Suppression...",
  className,
  size = "sm",
}: AdminDeleteButtonProps) => {
  const { pending } = useFormStatus();

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (pending) {
      return;
    }

    if (!window.confirm(confirmMessage)) {
      event.preventDefault();
    }
  };

  return (
    <Button
      type="submit"
      size={size}
      variant="destructive"
      disabled={pending}
      onClick={handleClick}
      className={cn("rounded-xl", className)}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        <>
          <Trash2 className="h-4 w-4" />
          {children}
        </>
      )}
    </Button>
  );
};

export default AdminDeleteButton;
