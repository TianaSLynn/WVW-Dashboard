import dynamic from "next/dynamic";

const WVWCommandCenter = dynamic(() => import("@/components/WVWCommandCenter"), {
  ssr: false,
  loading: () => (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#F9F5ED" }}
    >
      <div className="text-center space-y-3">
        <p className="font-serif text-3xl font-semibold" style={{ color: "#1C3A2A" }}>WVW</p>
        <p className="text-sm" style={{ color: "#3D3935" }}>Loading Intelligence Hub…</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return <WVWCommandCenter />;
}
