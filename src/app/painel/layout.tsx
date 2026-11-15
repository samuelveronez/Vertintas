import type { Metadata } from "next";
import { PanelFrame } from "@/features/orders/panel-frame";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <PanelFrame>{children}</PanelFrame>
    </div>
  );
}
