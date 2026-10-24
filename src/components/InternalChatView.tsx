"use client";

import React, { useState } from "react";
import { ChatMessage, MessagePriority, District } from "@/types";
import { UserSession } from "@/lib/auth";
import {
  MessageSquare,
  Send,
  Bell,
  Shield,
  MapPin,
  Clock,
  Filter,
  CornerDownRight,
  CheckCheck
} from "lucide-react";
import { toast } from "sonner";

interface InternalChatViewProps {
  messages: ChatMessage[];
  districts: District[];
  currentUser: UserSession;
  onMessageSent: (newMsg: ChatMessage) => void;
}

export default function InternalChatView({
  messages,
  districts,
  currentUser,
  onMessageSent,
}: InternalChatViewProps) {
  const [filterPriority, setFilterPriority] = useState<string>("All");
  const [filterDistrict, setFilterDistrict] = useState<string>("All");

  // Compose State
  const [senderName, setSenderName] = useState(currentUser.name);
  const [senderRole, setSenderRole] = useState(currentUser.title);
  const [senderDepartment, setSenderDepartment] = useState(currentUser.department);
  const [district, setDistrict] = useState(
    currentUser.district !== "All" ? currentUser.district : districts[0]?.name || "Lahore"
  );
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<MessagePriority>("Official Notice");
  const [isSending, setIsSending] = useState(false);

  const priorityBadges: Record<MessagePriority, { bg: string; text: string; iconColor: string }> = {
    "Urgent": { bg: "bg-red-50 text-red-800 border-red-300", text: "Urgent Directive", iconColor: "text-red-600" },
    "Official Notice": { bg: "bg-amber-50 text-amber-800 border-amber-300", text: "Official Notice", iconColor: "text-amber-600" },
    "Routine": { bg: "bg-emerald-50 text-emerald-800 border-emerald-300", text: "Routine Memorandum", iconColor: "text-emerald-600" },
    "Inquiry": { bg: "bg-blue-50 text-blue-800 border-blue-300", text: "Administrative Inquiry", iconColor: "text-blue-600" },
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName || !subject || !message) {
      toast.error("Please provide your name, subject, and message text.");
      return;
    }

    setIsSending(true);

    try {
      const payload = {
        senderName,
        senderRole,
        senderDepartment,
        district,
        subject,
        message,
        priority,
      };

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onMessageSent(data.data);
      toast.success("Official Memorandum Dispatched!", {
        description: `Subject: "${subject}" forwarded to ${district} Administration Desk.`
      });

      setSubject("");
      setMessage("");
    } catch (err: unknown) {
      toast.error("Dispatch Failed", {
        description: err instanceof Error ? err.message : "Unable to send the memorandum."
      });
    } finally {
      setIsSending(false);
    }
  };

  const filteredMessages = messages.filter((m) => {
    const matchesPriority = filterPriority === "All" || m.priority === filterPriority;
    const matchesDistrict = filterDistrict === "All" || m.district === filterDistrict;
    return matchesPriority && matchesDistrict;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-700" />
            HR Internal Communication & Camp Administration Panel
          </h2>
          <p className="text-xs text-slate-500">
            Encrypted official memorandum dispatch between MNA Offices, Deputy Commissioners, Councilors & Committee Heads
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200">
          <Shield className="w-3.5 h-3.5 text-emerald-700" />
          <span>Internal Government Comms Channel</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Message Feed & Filters */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-700" />
              Official Memorandums Feed ({filteredMessages.length})
            </span>

            <div className="flex items-center gap-2">
              <select
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
                className="text-xs p-1.5 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="All">All Districts</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="text-xs p-1.5 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="All">All Priorities</option>
                <option value="Urgent">Urgent Directive</option>
                <option value="Official Notice">Official Notice</option>
                <option value="Routine">Routine</option>
                <option value="Inquiry">Inquiry</option>
              </select>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="space-y-3.5">
            {filteredMessages.map((msg) => {
              const badge = priorityBadges[msg.priority] || priorityBadges["Routine"];
              const dateStr = new Date(msg.timestamp).toLocaleString("en-PK", {
                timeZone: "Asia/Karachi",
                dateStyle: "medium",
                timeStyle: "short",
              });

              return (
                <div
                  key={msg.id}
                  className="bg-white rounded-xl border border-slate-200/90 hover:border-emerald-500 shadow-sm transition-all p-5 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                        {msg.senderName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span>{msg.senderName}</span>
                          <span className="text-[11px] text-slate-500 font-normal">
                            ({msg.senderRole} • {msg.senderDepartment})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-700" />
                            {msg.district}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {dateStr}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className={`self-start sm:self-auto text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                      {badge.text}
                    </span>
                  </div>

                  {/* Subject and Body */}
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-1">
                      {msg.subject}
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 font-sans">
                      {msg.message}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1 font-mono text-emerald-800 font-semibold">
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Recorded on Internal HR System Official Ledger
                    </span>

                    <button
                      onClick={() => {
                        setSubject(`RE: ${msg.subject}`);
                        setMessage(`Acknowledged receipt from ${msg.senderName}. `);
                        toast.info("Reply Template Loaded in Dispatcher");
                      }}
                      className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <CornerDownRight className="w-3 h-3" />
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredMessages.length === 0 && (
              <div className="bg-white p-10 rounded-xl border border-slate-200 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold">No communications match the chosen filters.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Structured Memorandum Composer */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4 self-start">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-700" />
              Dispatch Official Memorandum
            </h3>
            <p className="text-[11px] text-slate-500">
              Circulate directives, job allocation quotas, and camp coordination notices
            </p>
          </div>

          <form onSubmit={handleSendMessage} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sender Officer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sardar Ahmad Yar"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  value={senderRole}
                  onChange={(e) => setSenderRole(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={senderDepartment}
                  onChange={(e) => setSenderDepartment(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  District Scope
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
                >
                  {districts.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Directive Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as MessagePriority)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-emerald-700"
                >
                  <option value="Official Notice">Official Notice</option>
                  <option value="Urgent">Urgent Directive</option>
                  <option value="Routine">Routine Memorandum</option>
                  <option value="Inquiry">Administrative Inquiry</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Subject Heading <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Allocation Quota Clearance for Ward 08"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Communication Body <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="Type formal notice, administrative decision, or urgent camp instruction..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? "Forwarding..." : "Dispatch Memorandum"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
