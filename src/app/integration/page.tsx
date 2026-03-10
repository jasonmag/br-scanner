import Link from "next/link";

export const metadata = {
  title: "API Integration | Barcode Scanner",
  description: "How to integrate the barcode scanner API with other applications."
};

const codeExample = `curl -X POST https://your-scanner-domain.com/api/identify \\
  -H "Authorization: Bearer <api_key>" \\
  -F "image=@./barcode.jpg"`;

const responseExample = `{
  "found": true,
  "value": "9556091140128",
  "format": "ean_13",
  "confidence": 0.88,
  "results": [
    {
      "value": "9556091140128",
      "format": "ean_13",
      "confidence": 0.88
    }
  ]
}`;

export default function IntegrationPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12">
      <div className="rounded-[2rem] border border-[var(--panel-border)] bg-[var(--panel)] p-8 shadow-scanner backdrop-blur">
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--sea)]">API Integration</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
          Connect other applications to the barcode scanner API.
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-[var(--muted)]">
          Send an image to this service, receive the decoded barcode value, and use that value in your own inventory,
          receiving, catalog, or lookup workflows.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            className="rounded-full bg-[var(--accent)] px-6 py-3 text-white transition hover:opacity-90"
            href="/scanner"
          >
            Open Scanner
          </Link>
          <Link
            className="rounded-full border border-[var(--panel-border)] px-6 py-3 text-[var(--text)] transition hover:bg-white/60"
            href="/"
          >
            Back Home
          </Link>
        </div>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-[var(--panel-border)] bg-white/60 p-6">
            <h2 className="text-2xl font-semibold">Endpoint</h2>
            <p className="mt-3 text-[var(--muted)]">
              Use <code>/api/identify</code> with <code>multipart/form-data</code>. The uploaded image field must be
              named <code>image</code>.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              <li>Method: `POST`</li>
              <li>Field: `image`</li>
              <li>Success: returns `found`, `value`, `format`, `confidence`, and `results`</li>
              <li>Max upload size: `2 MB`</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-[var(--panel-border)] bg-white/60 p-6">
            <h2 className="text-2xl font-semibold">Registration</h2>
            <p className="mt-3 text-[var(--muted)]">
              External API consumers should be registered and issued their own credential. CORS helps with browser
              access control, but it is not authentication.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              <li>Register each consuming application separately</li>
              <li>Issue one API key per application</li>
              <li>Track owner, status, and allowed origins</li>
              <li>Rotate or revoke credentials without affecting other integrations</li>
            </ul>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-[var(--panel-border)] bg-[#111827] p-6 text-white">
          <h2 className="text-2xl font-semibold">Example Request</h2>
          <pre className="mt-4 overflow-x-auto text-sm leading-6 text-orange-100">
            <code>{codeExample}</code>
          </pre>
        </section>

        <section className="mt-8 rounded-3xl border border-[var(--panel-border)] bg-white/60 p-6">
          <h2 className="text-2xl font-semibold">Example Response</h2>
          <pre className="mt-4 overflow-x-auto text-sm leading-6 text-[var(--text)]">
            <code>{responseExample}</code>
          </pre>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-[var(--panel-border)] bg-white/60 p-6">
            <h2 className="text-2xl font-semibold">Implementation Notes</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              <li>Prefer server-to-server calls when possible.</li>
              <li>Use the top-level `value` field as the primary decoded barcode.</li>
              <li>If `found` is `false`, ask the user to retake the image.</li>
              <li>Use `results` only when you need all matches or confidence details.</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-[var(--panel-border)] bg-white/60 p-6">
            <h2 className="text-2xl font-semibold">More Documentation</h2>
            <ul className="mt-4 space-y-3 text-sm text-[var(--muted)]">
              <li>
                Repo guide: <code>docs/api-integration-guide.md</code>
              </li>
              <li>
                Registration guide: <code>docs/api-user-registration.md</code>
              </li>
              <li>
                Health check: <Link className="text-[var(--sea)] underline" href="/api/health">/api/health</Link>
              </li>
              <li>
                API metadata: <Link className="text-[var(--sea)] underline" href="/api/identify">/api/identify</Link>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
