declare namespace JSX {
  interface IntrinsicElements {
    "model-viewer": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      src?: string;
      "auto-rotate"?: boolean | string;
      "camera-controls"?: boolean | string;
      "disable-zoom"?: boolean | string;
      "environment-image"?: string;
      poster?: string;
      loading?: "eager" | "lazy";
      ar?: boolean | string;
      "shadow-intensity"?: string | number;
    };
  }
}
