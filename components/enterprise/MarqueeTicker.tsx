"use client"

const items = [
  'Vision Intelligence',
  'Inventory Signals',
  'AI Workflows',
  'Customer Memory',
  'Marketing Automation',
  'Operational Copilot',
];

export function MarqueeTicker() {
  const repeated = [...items, ...items, ...items];

  return (
    <section className="overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
      <div className="overflow-hidden py-3.5">
        <div className="marquee-track flex w-max items-center gap-7 whitespace-nowrap text-[11px] uppercase tracking-[0.18em] text-white/45">
          {repeated.map((item, index) => (
            <span key={`${item}-${index}`} className="flex items-center gap-7">
              <span>{item}</span>
              <span className="h-1 w-1 rounded-full bg-gradient-to-r from-[#FF9C2A] to-[#3BA8FF]" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
