import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const SYSTEM_PROMPT = `You are a food and weight logging assistant. The user will send you text, a voice transcript, or describe a photo of food/a weight reading.

Respond ONLY with a valid JSON object — no prose, no markdown, no backticks.

Detect whether the input is about FOOD or WEIGHT.

For FOOD return:
{
  "type": "food",
  "items": [
    {
      "item": "descriptive name of the food",
      "calories": <integer estimate>,
      "protein": <decimal grams estimate>,
      "logged_at": "<ISO 8601 datetime in Europe/Tallinn timezone>",
      "assumptions": "brief note on portion size assumptions"
    }
  ]
}

For WEIGHT return:
{
  "type": "weight",
  "items": [
    {
      "weight": <decimal kg>,
      "logged_at": "<ISO 8601 datetime in Europe/Tallinn timezone>",
      "assumptions": "any assumptions made"
    }
  ]
}

Rules:
- If no date/time is mentioned, use the current time provided in the user message.
- If multiple food items are mentioned, return multiple objects in the items array.
- Be generous but realistic with calorie estimates.
- Always return valid JSON only.`;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // ── GET /api/log?type=food|weight ─────────────────────────────────────────
  if (req.method === "GET") {
    const type = req.query.type || "food";

    if (type === "weight") {
      const { data, error } = await supabase
        .from("weight_log")
        .select("*")
        .order("logged_at", { ascending: false })
        .limit(200);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ data });
    }

    // food — fetch last 200 entries
    const { data, error } = await supabase
      .from("food_log")
      .select("*")
      .order("logged_at", { ascending: false })
      .limit(200);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ data });
  }

  // ── POST /api/log ──────────────────────────────────────────────────────────
  if (req.method !== "POST") return res.status(405).end();

  const { input, image, imageType } = req.body;
  if (!input && !image) {
    return res.status(400).json({ error: "No input provided" });
  }

  // Build message content for Claude
  const now = new Date().toLocaleString("en-US", {
    timeZone: "Europe/Tallinn",
    dateStyle: "full",
    timeStyle: "long",
  });

  const textContent = {
    type: "text",
    text: `Current date and time in Tallinn: ${now}\n\nUser input: ${input || "See the image provided."}`,
  };

  const messageContent = image
    ? [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: imageType || "image/jpeg",
            data: image,
          },
        },
        textContent,
      ]
    : [textContent];

  // Call Claude
  let claudeResult;
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: messageContent }],
    });

    const raw = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    // Strip any accidental markdown fences
    const clean = raw.replace(/```json|```/g, "").trim();
    claudeResult = JSON.parse(clean);
  } catch (err) {
    return res.status(500).json({ error: "Claude parsing failed", detail: err.message });
  }

  // Insert into Supabase
  try {
    const savedItems = [];

    if (claudeResult.type === "weight") {
      for (const entry of claudeResult.items) {
        const { data, error } = await supabase
          .from("weight_log")
          .insert({
            weight: entry.weight,
            logged_at: entry.logged_at,
          })
          .select()
          .single();
        if (error) throw error;
        savedItems.push({ ...data, assumptions: entry.assumptions });
      }
    } else {
      for (const entry of claudeResult.items) {
        const { data, error } = await supabase
          .from("food_log")
          .insert({
            item: entry.item,
            calories: entry.calories,
            protein: entry.protein,
            logged_at: entry.logged_at,
          })
          .select()
          .single();
        if (error) throw error;
        savedItems.push({ ...data, assumptions: entry.assumptions });
      }
    }

    return res.status(200).json({
      type: claudeResult.type,
      items: savedItems,
    });
  } catch (err) {
    return res.status(500).json({ error: "Supabase insert failed", detail: err.message });
  }
}
