import type { Metadata } from "next";
import OrdersList from "@/components/OrdersList";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Orders | Fish Your Style",
  description: "Review your Fish Your Style orders and track their status.",
};

export default function OrdersPage() {
  return (
    <PageShell>
      <OrdersList />
    </PageShell>
  );
}
