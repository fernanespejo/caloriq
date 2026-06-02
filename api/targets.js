import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // ── GET /api/targets ──────────────────────────────────────────────────────
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("user_targets")
      .select("*")
      .eq("key", "default")
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ data });
  }

  // ── PUT /api/targets ──────────────────────────────────────────────────────
  if (req.method === "PUT") {
    const { cal_goal, prot_goal, w_start_kg, w_start_date, w_target_kg, w_target_date } = req.body;
    const { data, error } = await supabase
      .from("user_targets")
      .update({ cal_goal, prot_goal, w_start_kg, w_start_date, w_target_kg, w_target_date, updated_at: new Date().toISOString() })
      .eq("key", "default")
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ data });
  }

  return res.status(405).end();
}
