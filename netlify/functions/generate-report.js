// Calls Claude to generate a personalized homebuyer readiness report.
const Anthropic = require('@anthropic-ai/sdk');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Anthropic API key not configured on server' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  const {
    credit, monthly, downpay, homePrice, state, debts,
    veteran, employment, creditGap, downGap, downGapMos,
    canAffordFHA, anyProgram, backEndDTI, fhaTotal
  } = data;

  const fmt = (n) => '$' + Math.round(n).toLocaleString();

  const prompt = `You are a knowledgeable, honest, and encouraging first-time homebuyer advisor named Terrii. Write a short personal assessment for this specific buyer. Be direct, specific, and warm — like a knowledgeable friend explaining their exact situation in plain English. Use their real numbers. No fluff, no generic advice, no lists or bullet points. Write 4 solid paragraphs only.

Buyer profile:
- Credit score: ${credit}
- Monthly gross income: ${fmt(monthly)}
- Down payment saved: ${fmt(downpay)}
- Monthly debt payments (excluding housing): ${fmt(debts)}
- Target home price: ${fmt(homePrice)}
- State: ${state}
- Veteran/military: ${veteran ? 'Yes' : 'No'}
- Employment type: ${employment || 'W-2'}
- Estimated FHA monthly payment (PITI): ${fmt(fhaTotal)}
- Back-end DTI: ${Math.round(backEndDTI)}%
- Can afford FHA now: ${canAffordFHA ? 'Yes' : 'No'}
- Qualifies for at least one assistance program: ${anyProgram ? 'Yes' : 'No'}
- Credit gap to FHA minimum (580): ${creditGap > 0 ? creditGap + ' points needed' : 'Already meets FHA minimum'}
- Down payment gap to 3.5%: ${downGap > 0 ? fmt(downGap) + ' short (approx ' + downGapMos + ' months to save at current pace)' : 'Already has enough'}

Write the 4-paragraph report now. Address the buyer directly as "you." Start with their current standing, then their most important next step, then something specific they probably don't know about their situation or state, then one concrete action they can take this week.`;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 700,
      messages: [{ role: 'user', content: prompt }]
    });

    const reportText = message.content[0].text.trim();
    return { statusCode: 200, headers, body: JSON.stringify({ report: reportText }) };
  } catch (err) {
    console.error('Anthropic error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || 'Report generation failed' }) };
  }
};
