import type { Metadata } from "next";
import { AccountView } from "@/features/customers/account-view";

export const metadata: Metadata = { title: "Minha conta" };

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold text-forest">Minha conta</h1>
      <AccountView />
    </div>
  );
}
