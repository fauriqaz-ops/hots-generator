export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY belum diset di environment variables Vercel.' });
  }

  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt tidak valid.' });
  }

  try {
    const openrouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://hots-generator.vercel.app',
        'X-Title': 'HOTS Generator'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        max_tokens: 4096,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: 'Kamu adalah ahli penyusunan soal HOTS kurikulum Merdeka Belajar Indonesia. Selalu balas HANYA dengan JSON valid, tanpa teks tambahan, tanpa markdown backtick.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!openrouterRes.ok) {
      const errData = await openrouterRes.json().catch(() => ({}));
      const msg = errData?.error?.message || `OpenRouter error: ${openrouterRes.status}`;
      return res.status(502).json({ error: msg });
    }

    const openrouterData = await openrouterRes.json();
    const text = openrouterData?.choices?.[0]?.message?.content || '';

    if (!text) {
      return res.status(502).json({ error: 'Model tidak menghasilkan output. Coba lagi.' });
    }

    return res.status(200).json({ text });

  } catch (err) {
    console.error('Serverless function error:', err);
    return res.status(500).json({ error: `Internal error: ${err.message}` });
  }
}
