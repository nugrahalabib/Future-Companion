"use client";

export default function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base */}
      <div className="absolute inset-0 bg-obsidian" />
      {/* Subtle radial gradients */}
      <div
        className="absolute top-0 left-0 w-[600px] h-[600px] opacity-30"
        style={{
          background:
            "radial-gradient(circle, rgba(0, 240, 255, 0.06) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-[800px] h-[800px] opacity-20"
        style={{
          background:
            "radial-gradient(circle, rgba(57, 255, 20, 0.04) 0%, transparent 70%)",
        }}
      />
      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
      }} />
    </div>
  );
}
