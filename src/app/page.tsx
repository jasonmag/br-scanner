import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-12">
      <div className="rounded-[2rem] border border-[var(--panel-border)] bg-[var(--panel)] p-8 shadow-scanner backdrop-blur">
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--sea)]">
          Mobile Browser Scanner
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
          Barcode scanning with the device camera, layered fallbacks, and mobile-first controls.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">
          Open the scanner on a phone, grant camera access, and start scanning continuously without a manual capture button.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            className="rounded-full bg-[var(--accent)] px-6 py-3 text-white transition hover:opacity-90"
            href="/scanner"
          >
            Open Scanner
          </Link>
          <a
            className="rounded-full border border-[var(--panel-border)] px-6 py-3 text-[var(--text)] transition hover:bg-white/60"
            href="/integration"
          >
            API Integration
          </a>
          <a
            className="rounded-full border border-[var(--panel-border)] px-6 py-3 text-[var(--text)]"
            href="/api/health"
          >
            Health Check
          </a>
        </div>
      </div>
    </main>
  );
}
