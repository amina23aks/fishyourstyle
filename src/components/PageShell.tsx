import type { PropsWithChildren } from "react";

export default function PageShell({ children }: PropsWithChildren) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}
