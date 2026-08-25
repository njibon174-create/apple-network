// app/admin/DashboardCharts.jsx — client charts for the admin dashboard (Recharts)
// Loaded via next/dynamic (ssr:false) so Recharts never runs during server render.
"use client";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid,
} from "recharts";
import { taka } from "@/lib/data";

const COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#22c55e", "#94a3b8"];

function Panel({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold text-ink">{title}</h3>
      <div style={{ width: "100%", height: 220 }}>{children}</div>
    </div>
  );
}

export default function ChartPanel({ revenueData, statusData, categoryData }) {
  // Guard against SSR/hydration: only render after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <Panel title="লোড হচ্ছে…"><div /></Panel>;

  return (
    <>
      <Panel title="গত ১৪ দিনের বিক্রয় (৳)">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [taka(v), "বিক্রয়"]} />
            <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="অর্ডার অবস্থা">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={80} label>
              {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="ক্যাটাগরি অনুযায়ী বিক্রয়">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={categoryData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [taka(v), "বিক্রয়"]} />
            <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </>
  );
}
