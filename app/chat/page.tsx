"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  return (
    <div className="relative flex min-h-screen flex-col bg-[#fafaf7] text-zinc-900">
      <div className="aurora opacity-50" />
      <div className="grain" />

      <SiteHeader />

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8">
        <div className="flex-1 space-y-6">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-zinc-900/10 bg-white/70 p-10 text-center backdrop-blur">
              <p className="font-display text-3xl text-zinc-900">Address the cabinet.</p>
              <p className="mt-3 text-sm text-zinc-600">
                Paste a law, ask for a counter-proposal, or request a plain-language explanation.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {[
                  "Explain the EU AI Act in plain language",
                  "Audit France's PACTE law and propose improvements",
                  "What if we taxed AI-generated content?",
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      sendMessage({ text: s });
                    }}
                    className="rounded-full border border-zinc-900/10 bg-white px-3 py-1.5 text-xs text-zinc-700 transition hover:border-zinc-900/20 hover:bg-zinc-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-zinc-900 text-zinc-50"
                    : "border border-zinc-900/10 bg-white/80 text-zinc-900 backdrop-blur"
                }`}
              >
                {m.parts.map((part, i) =>
                  part.type === "text" ? (
                    <span key={i} className="whitespace-pre-wrap">
                      {part.text}
                    </span>
                  ) : null
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-zinc-900/10 bg-white/80 px-4 py-3 backdrop-blur">
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim() || isLoading) return;
            sendMessage({ text: input });
            setInput("");
          }}
          className="sticky bottom-6 mt-8"
        >
          <div className="flex items-end gap-2 rounded-2xl border border-zinc-900/10 bg-white/90 p-2 shadow-2xl shadow-zinc-900/5 backdrop-blur-xl">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!input.trim() || isLoading) return;
                  sendMessage({ text: input });
                  setInput("");
                }
              }}
              rows={1}
              placeholder="Ask the cabinet..."
              className="flex-1 resize-none bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
            />
            <Button type="submit" disabled={!input.trim() || isLoading} size="sm">
              Send
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
