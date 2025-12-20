import type { Metadata } from "next";

import { ContactMessagesClient } from "./ContactMessagesClient";

export const metadata: Metadata = {
  title: "Contact messages | Admin | Fish Your Style",
  description: "Review recent contact form submissions.",
};

export default function ContactMessagesPage() {
  return <ContactMessagesClient />;
}
