export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
  if (!TOGETHER_API_KEY) {
    return res.status(500).json({ error: 'TOGETHER_API_KEY belum diset di environment variables Vercel.' });
  }

  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt tidak valid.' });
  }

  try {
    const togetherRes = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOGETHER_API_KEY}`
      },
      body: JSON.stringify({
        model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
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

    if (!togetherRes.ok) {
      const errData = await togetherRes.json().catch(() => ({}));
      const msg = errData?.error?.message || `Together AI error: ${togetherRes.status}`;
      return res.status(502).json({ error: msg });
    }

    const togetherData = await togetherRes.json();
    const text = togetherData?.choices?.[0]?.message?.content || '';

    if (!text) {
      return res.status(502).json({ error: 'Model tidak menghasilkan output. Coba lagi.' });
    }

    return res.status(200).json({ text });

  } catch (err) {
    console.error('Serverless function error:', err);
    return res.status(500).json({ error: `Internal error: ${err.message}` });
  }
}
