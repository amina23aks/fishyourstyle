import type { Metadata } from "next";
import CheckoutClient from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout | Fish Your Style",
  description: "Complete your Fish Your Style order securely.",
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
