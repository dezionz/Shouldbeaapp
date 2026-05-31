module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, system, licenseKey } = req.body;

  // Check license key FIRST before anything else
  if (licenseKey) {
    if (licenseKey === process.env.masterkey) {
      return res.status(200).json({ unlocked: true });
    } else {
      return res.status(200).json({ unlocked: false });
    }
  }

  // Then check API key for regular requests
  if (!process.env.shouldbeaapp) {
    return res.status(500).json({ error: 'Missing API key' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.shouldbeaapp,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system,
        messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: JSON.stringify(data) });
    }

    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
