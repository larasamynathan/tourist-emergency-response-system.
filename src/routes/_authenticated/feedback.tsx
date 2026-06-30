import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMyUser } from "@/lib/use-role";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/feedback")({
  component: FeedbackPage,
});

function FeedbackPage() {
  const { data: user } = useMyUser();
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: mine } = useQuery({
    queryKey: ["my-feedback", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("feedback").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function submit() {
    if (!user || !rating) return toast.error("Please select a rating");
    setBusy(true);
    const { error } = await supabase.from("feedback").insert({ user_id: user.id, rating, comment: comment || null });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Thanks for your feedback!");
    setRating(0); setComment("");
    qc.invalidateQueries({ queryKey: ["my-feedback", user.id] });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Rate Your Experience</h1>
        <p className="text-sm text-muted-foreground">Help us keep travelers safe.</p>
      </div>
      <Card className="p-6">
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}>
              <Star className={`h-10 w-10 transition ${
                (hover || rating) >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
              }`} />
            </button>
          ))}
        </div>
        <Textarea
          className="mt-4" placeholder="Tell us more (optional)" rows={4} maxLength={500}
          value={comment} onChange={(e) => setComment(e.target.value)}
        />
        <Button onClick={submit} disabled={busy || !rating} className="mt-4 w-full">Submit feedback</Button>
      </Card>

      {!!mine?.length && (
        <Card className="p-4">
          <h3 className="mb-2 font-semibold">Your past feedback</h3>
          <div className="space-y-2">
            {mine.map((f) => (
              <div key={f.id} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < f.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                  ))}
                  <span className="ml-2 text-xs text-muted-foreground">{formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}</span>
                </div>
                {f.comment && <p className="mt-1 text-muted-foreground">{f.comment}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
