"use client";

import { FormEvent, useState } from "react";

import { Loader2 } from "lucide-react";

type HomeNewsletterProps = {
  title: string;
  description: string;
  placeholder: string;
  buttonLabel: string;
  successMessage: string;
  errorMessage: string;
};

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim().toLowerCase());

export default function HomeNewsletter({
  title,
  description,
  placeholder,
  buttonLabel,
  successMessage,
  errorMessage,
}: HomeNewsletterProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      setStatus("error");
      setFeedback("Merci de saisir une adresse e-mail valide.");
      return;
    }

    setStatus("loading");
    setFeedback("");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed newsletter subscription: ${response.status}`);
      }

      setStatus("success");
      setEmail("");
      setFeedback(successMessage);
    } catch (error) {
      console.error("Failed newsletter subscription:", error);
      setStatus("error");
      setFeedback(errorMessage);
    }
  };

  return (
    <section
      id="newsletter"
      className="scroll-mt-28 rounded-[16px] border border-shop_light_green/24 bg-white p-6 shadow-[0_18px_38px_-32px_rgba(22,46,110,0.45)] md:p-8"
    >
      <div className="grid items-start gap-6 md:grid-cols-[1.05fr_0.95fr]">
        <div>
          <h2 className="text-[1.6rem] font-bold tracking-[-0.02em] text-shop_dark_green md:text-[1.9rem]">
            {title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-lightColor">
            {description}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <label className="sr-only" htmlFor="newsletter-email">
            Adresse e-mail
          </label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (status !== "idle") {
                setStatus("idle");
                setFeedback("");
              }
            }}
            required
            placeholder={placeholder}
            className="h-11 w-full rounded-md border border-shop_light_green/35 bg-shop_light_bg/35 px-4 text-sm text-darkColor outline-none transition focus:border-shop_dark_green focus:ring-4 focus:ring-shop_light_green/15"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-shop_dark_green px-5 text-sm font-semibold text-white transition-colors hover:bg-shop_btn_dark_green disabled:pointer-events-none disabled:opacity-70"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Envoi...
              </>
            ) : (
              buttonLabel
            )}
          </button>
          {feedback ? (
            <p
              className={`text-xs ${status === "success" ? "text-emerald-600" : "text-rose-600"}`}
              role="status"
            >
              {feedback}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
