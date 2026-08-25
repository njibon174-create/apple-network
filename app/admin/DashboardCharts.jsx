// app/admin/DashboardCharts.jsx — client charts for the admin dashboard (Recharts)
"use client";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid,
} from "recharts";
import { taka } from "@/lib/data";

const COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#22c55e", "#94a3b8"];

export function RevenueChart({ data }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold text-ink">গত ১৪ দিনের বিক্রয় (৳)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => [taka(v), "বিক্রয়"]} />
          <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusChart({ data }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold text-ink">অর্ডার অবস্থা</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={80} label>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryChart({ data }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold text-ink">ক্যাটাগরি অনুযায়ী বিক্রয়</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => [taka(v), "বিক্রয়"]} />
          <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
