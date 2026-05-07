"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DollarSign, TrendingUp, Zap } from "lucide-react";
import type { Conversion, ConversionStatus } from "@/types/dashboard";
import { revenueByPlatform } from "@/utils/calculations";

const C = { forest:"#1C3A2A", bone:"#F5F0E8", rose:"#C4A09A", gold:"#B8A06A", charcoal:"#3D3935", sage:"#4A5E4F", ivory:"#F9F5ED", warmBlack:"#1A1714" };

const STATUS_COLORS: Record<ConversionStatus, string> = {
  "New": C.gold, "In Progress": "#0A66C2", "Converted": C.forest,
  "Lost": C.rose, "Nurture": C.sage,
};
const PIE_COLORS = [C.forest, C.gold, C.rose, C.sage, "#0A66C2", "#A0522D", "#708090"];

interface Props { conversions: Conversion[] }

export default function ConversionEngine({ conversions }: Props) {
  const totalRevenue = conversions.reduce((s, c) => s + c.conversionValue, 0);
  const converted    = conversions.filter((c) => c.status === "Converted").length;
  const activeLeads  = conversions.filter((c) => ["New","In Progress","Warm Lead","Nurture"].includes(c.status)).length;

  const byPlatform = revenueByPlatform(conversions);
  const platformData = Object.entries(byPlatform).map(([name, value]) => ({ name: name.replace(" Personal","").replace(" WVW",""), value })).sort((a,b)=>b.value-a.value);

  const byType: Record<string, number> = {};
  conversions.forEach((c) => { byType[c.conversionType] = (byType[c.conversionType] ?? 0) + 1; });
  const typeData = Object.entries(byType).map(([name, value]) => ({ name, value })).sort((a,b)=>b.value-a.value);

  const byStatus: Record<string, number> = {};
  conversions.forEach((c) => { byStatus[c.status] = (byStatus[c.status] ?? 0) + 1; });
  const funnelOrder: ConversionStatus[] = ["New","In Progress","Nurture","Converted","Lost"];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pipeline Value", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: C.forest },
          { label: "Converted",      value: converted,                           icon: TrendingUp, color: "#065F46" },
          { label: "Active Leads",   value: activeLeads,                         icon: Zap,        color: "#A0522D" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="rounded-2xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg" style={{ background: color + "20" }}><Icon className="w-3.5 h-3.5" style={{ color }} /></div>
                <span className="text-xs" style={{ color: C.charcoal }}>{label}</span>
              </div>
              <p className="text-xl font-serif font-semibold" style={{ color }}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
          <CardHeader><CardTitle className="font-serif text-lg">Revenue by Platform</CardTitle></CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData} margin={{ left: -20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.charcoal }} />
                <YAxis tick={{ fontSize: 10, fill: C.charcoal }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, "Revenue"]} contentStyle={{ background: C.ivory, borderColor: "#DDD7CD", borderRadius: 12, fontSize: 11 }} />
                <Bar dataKey="value" fill={C.forest} radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
          <CardHeader><CardTitle className="font-serif text-lg">Conversion Types</CardTitle></CardHeader>
          <CardContent className="h-[240px] flex items-center">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                  {typeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: C.ivory, borderColor: "#DDD7CD", borderRadius: 12, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {typeData.map((t, i) => (
                <div key={t.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-[10px]" style={{ color: C.charcoal }}>{t.name}</span>
                  <span className="text-[10px] ml-auto font-medium" style={{ color: C.warmBlack }}>{t.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
        <CardHeader>
          <CardTitle className="font-serif text-xl">Conversion Pipeline</CardTitle>
          <CardDescription style={{ color: C.charcoal }}>Status breakdown of all conversion activity.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {funnelOrder.map((status) => {
            const items = conversions.filter((c) => c.status === status);
            if (!items.length) return null;
            return (
              <div key={status}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: (STATUS_COLORS[status] ?? C.charcoal) + "22", color: STATUS_COLORS[status] ?? C.charcoal }}>{status}</span>
                  <span className="text-xs" style={{ color: C.charcoal }}>{items.length} conversion{items.length > 1 ? "s" : ""} · ${items.reduce((s,c)=>s+c.conversionValue,0).toLocaleString()} value</span>
                </div>
                <div className="space-y-1.5">
                  {items.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-2xl text-xs" style={{ background: C.ivory }}>
                      <div>
                        <span className="font-medium" style={{ color: C.warmBlack }}>{c.conversionType}</span>
                        <span className="ml-2" style={{ color: C.charcoal }}>via {c.sourcePlatform.replace(" Personal","").replace(" WVW","")}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {c.conversionValue > 0 && <span className="font-medium" style={{ color: C.forest }}>${c.conversionValue.toLocaleString()}</span>}
                        <span style={{ color: C.charcoal }}>{new Date(c.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
