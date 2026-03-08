import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartUserGuard from "@/components/CartUserGuard";

export const revalidate = 300;

export const metadata: Metadata = {
  title: {
    template: "%s - Zayna",
    default: "Zayna",
  },
  description: "Boutique en ligne Zayna, tout ce dont vous avez besoin au meme endroit.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <CartUserGuard />
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </>
  );
}
