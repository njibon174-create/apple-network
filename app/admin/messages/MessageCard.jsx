// app/admin/messages/MessageCard.jsx — message with reply + status (server action)
"use client";
import { useState } from "react";
import { replyToMessage } from "@/app/actions/messages";
import Icon from "@/components/Icon";

export default function MessageCard({ msg }) {
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState(msg.admin_reply || "");

  const statusColor = { new: "bg-amber-100 text-amber-700", replied: "bg-green-100 text-green-700", closed: "bg-gray-100 text-gray-600" };

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-ink">{msg.name}</p>
          <p className="text-xs text-ink-muted">{msg.phone || msg.email || ""} {msg.order_number ? `· অর্ডার: ${msg.order_number}` : ""}</p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[msg.status] || statusColor.closed}`}>{msg.status}</span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft">{msg.message}</p>

      <div className="mt-3 border-t border-gray-100 pt-3">
        <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2}
          placeholder="রিপ্লাই লিখুন…"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand" />
        <div className="mt-2 flex gap-2">
          <button disabled={busy} onClick={async () => { setBusy(true); await replyToMessage(msg.id, reply); setBusy(false); }}
            className="btn-primary text-sm"><Icon name="Send" size={14} /> সেভ</button>
          {msg.status !== "closed" && (
            <button disabled={busy} onClick={async () => { setBusy(true); await closeMessage(msg.id); setBusy(false); }}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-ink-soft hover:bg-gray-50">বন্ধ</button>
          )}
        </div>
      </div>
    </div>
  );
}
