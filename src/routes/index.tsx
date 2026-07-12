import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

// Aurora OS is a self-contained vanilla HTML/CSS/JS desktop environment served
// from /os/. It is embedded full-screen here so it runs isolated from the
// React app shell (no framework leakage into the OS code).
function Index() {
  return (
    <iframe
      src="/os/index.html"
      title="Aurora OS — Liquid Glass Desktop"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        border: "none",
      }}
    />
  );
}
