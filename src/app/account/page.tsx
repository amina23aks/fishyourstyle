import type { Metadata } from "next";

import AccountClient from "./AccountClient";

export const metadata: Metadata = {
  title: "Account | Fish Your Style",
  description: "Access your Fish Your Style account and order history.",
};

export default function AccountPage() {
  return <AccountClient />;
}
