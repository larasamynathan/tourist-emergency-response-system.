import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Bot, User } from "lucide-react";
import { chatWithAI } from "@/lib/ai-chat.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chatbot")({
  component: Chatbot,
});

type Msg = { role: "user" | "assistant"; content: string };

function Chatbot() {
  const ai = useServerFn(chatWithAI);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I'm your SafeTrail assistant. Ask me about safety tips, scams to avoid, what to do in an emergency, or how to use the app." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const { reply } = await ai({ data: { messages: next } });
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-180px)] max-w-3xl flex-col space-y-4">
      <div>
        <h1 className="text-2xl font-bold">AI Safety Assistant</h1>
        <p className="text-sm text-muted-foreground">Powered by Lovable AI</p>
      </div>
      <Card className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"
              }`}>{m.content}</div>
              {m.role === "user" && (
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          {busy && (
            <div className="flex gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Bot className="h-4 w-4" /></div>
              <div className="rounded-2xl bg-secondary px-4 py-2 text-sm text-muted-foreground">Thinking…</div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div className="border-t p-3">
          <div className="flex gap-2">
            <Textarea
              value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask about safety, scams, emergencies…"
              rows={1} className="min-h-[44px] resize-none"
            />
            <Button onClick={send} disabled={busy || !input.trim()} className="shrink-0">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
