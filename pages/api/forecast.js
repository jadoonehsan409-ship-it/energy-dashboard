// pages/api/forecast.js
// Calls Hugging Face Space for Prophet forecasting

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { dailyData, hfApiUrl } = req.body;
  if (!hfApiUrl || !dailyData) {
    return res.status(400).json({ error: 'Missing hfApiUrl or dailyData' });
  }

  try {
    const response = await fetch(`${hfApiUrl}/forecast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ daily_data: dailyData }),
      signal: AbortSignal.timeout(30000), // 30s timeout (HF may need to wake up)
    });

    if (!response.ok) throw new Error(`HF API error: ${response.status}`);
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    // Fallback: return null so frontend uses JS forecast
    res.status(200).json({ error: error.message, fallback: true });
  }
}
