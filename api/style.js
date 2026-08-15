// Vercel serverless function: /api/style
// Keeps the Gemini API key on the server — never sent to the browser.

const SYSTEM_PROMPT = `You are a professional fashion stylist and colorist. A user has shared information about themselves — this may include a photo, a written description, and/or answers to a few style questions. Use whatever is provided; some fields may be empty, and that's fine.

Your job:
1. Identify, when visible or stated: skin undertone (Warm / Cool / Neutral), general body proportions, and any stated style preferences.
2. Recommend:
   - Best colors for them, and briefly why (undertone-based). Give 5-6 colors as plain color names (e.g. "terracotta", "forest green", "cream") so they can be turned into swatches.
   - Cuts/silhouettes that flatter their proportions (2-4 items).
   - 2-3 style directions that suit their stated preferences and context.
3. Be warm and encouraging. Never say something "doesn't suit" someone in a critical way — frame it as what brings out their features, not what to avoid.
4. If information is missing, work with what's given and do your best — don't refuse or ask for more.

Respond with ONLY valid JSON, no markdown fences, no preamble, in exactly this shape:
{
  "undertone": "Warm | Cool | Neutral | Unclear",
  "best_colors": ["color name", "color name", "..."],
  "flattering_cuts": ["...", "..."],
  "style_directions": ["...", "..."],
  "summary": "2-3 warm, specific sentences summarizing the read"
}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server is missing GEMINI_API_KEY' });
  }

  const { photoBase64, text, questionnaire } = req.body || {};

  const parts = [];

  let userText = '';
  if (text) userText += `Self-description: ${text}\n`;
  if (questionnaire) {
    const { undertone, shape, style, context } = questionnaire;
    if (undertone) userText += `Stated undertone: ${undertone}\n`;
    if (shape) userText += `Stated body shape: ${shape}\n`;
    if (style) userText += `Style they're drawn to: ${style}\n`;
    if (context) userText += `Mostly styling for: ${context}\n`;
  }
  if (!userText) userText = 'No text provided — rely on the photo alone.';

  parts.push({ text: userText });

  if (photoBase64) {
    const match = /^data:(image\/\w+);base64,(.*)$/.exec(photoBase64);
    if (match) {
      parts.push({
        inline_data: {
          mime_type: match[1],
          data: match[2]
        }
      });
    }
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts }],
          generationConfig: { temperature: 0.7 }
        })
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return res.status(502).json({ error: `Gemini error: ${errText.slice(0, 200)}` });
    }

    const data = await geminiRes.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = rawText.replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(502).json({ error: 'Could not parse style response. Try again.' });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
