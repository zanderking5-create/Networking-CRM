import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";

// Shared chrome for every authenticated page: persistent sidebar nav + a
// single centered content column. The shell is full-width and only the
// content column is centered — centering both nests one centered box inside
// another and leaves the content looking adrift at wide viewports.
// Auth is still enforced per-page via requireUser(); this layout is
// presentation only.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      {/* Keyboard users land on the sidebar first on every page; this lets
          them jump past it instead of tabbing the nav each time. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <Sidebar />
      {/* Generous but capped: wide enough for a two-column dashboard and a
          properties rail, short enough that prose lines stay readable.
          Pages compose their own internal columns. */}
      <main id="main" className="min-w-0 flex-1 px-6 py-10 sm:px-10 sm:py-14">
        <div className="mx-auto w-full max-w-5xl space-y-10">{children}</div>
      </main>
    </div>
  );
}
