"use client";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: "#F5F0E8" }}>
      <div className="max-w-md text-center space-y-4">
        <p className="font-serif text-3xl" style={{ color: "#1C3A2A" }}>Something went wrong.</p>
        <p className="text-sm" style={{ color: "#3D3935" }}>{error.message ?? "An unexpected error occurred."}</p>
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-2xl text-sm font-medium"
          style={{ background: "#1C3A2A", color: "#F5F0E8" }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
