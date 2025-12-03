import type * as React from "react";

declare module "react-dom" {
  export function createPortal(
    children: React.ReactNode,
    container: Element | DocumentFragment,
    key?: null | string,
  ): React.ReactPortal;
}
