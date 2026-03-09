export function ScannerOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem] border border-white/20"
    >
      <div className="absolute inset-x-[14%] top-[34%] h-[28%] rounded-[1.5rem] border-2 border-[var(--accent)] shadow-[0_0_0_9999px_rgba(16,20,34,0.28)]" />
      <div className="absolute inset-x-[18%] top-1/2 h-px -translate-y-1/2 bg-[var(--accent)]/80" />
    </div>
  );
}
