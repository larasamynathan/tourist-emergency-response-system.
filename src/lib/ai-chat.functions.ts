import { createServerFn } from "@tanstack/react-start";

type Msg = { role: "user" | "assistant" | "system"; content: string };

export const chatWithAI = createServerFn({ method: "POST" })
  .inputValidator((data: { messages: Msg[] }) => data)
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY missing");

    const system: Msg = {
      role: "system",
      content:
        "You are SafeTrail Assistant, a friendly AI safety guide for tourists. Provide concise, practical answers about travel safety, local emergency procedures, scam avoidance, weather precautions, cultural tips, and how to use the SafeTrail app's SOS, incident reporting, and emergency contacts features. If a user reports an active emergency, instruct them to press the red SOS button immediately and call local emergency services.",
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [system, ...data.messages.slice(-20)],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI error ${res.status}: ${text.slice(0, 200)}`);
    }
    const json = await res.json();
    const reply: string = json.choices?.[0]?.message?.content ?? "Sorry, I had no response.";
    return { reply };
  });
