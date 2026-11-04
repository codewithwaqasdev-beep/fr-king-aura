import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

const App = lazy(() => import("@/app/App"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FR-KING AURA — Trading Intelligence Terminal" },
      { name: "description", content: "FR-KING AURA AI Bot Pro Max 2.1 — live signals, license activation and admin control." },
      { property: "og:title", content: "FR-KING AURA — Trading Intelligence Terminal" },
      { property: "og:description", content: "FR-KING AURA AI Bot Pro Max 2.1 — live signals, license activation and admin control." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <main className="bot-page" />;
  return (
    <Suspense fallback={<main className="bot-page" />}>
      <App />
    </Suspense>
  );
}
