const Anthropic = require('@anthropic-ai/sdk');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const client = new Anthropic();

  try {
    const data = JSON.parse(event.body || '{}');

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system:
        'You are a knowledgeable, empathetic financial guide helping a first-time homebuyer understand their situation. Write like a trusted friend who happens to know mortgages — not a lender, not a lawyer. Be honest, specific to their numbers, and encouraging where warranted.',
      messages: [{ role: 'user', content: buildPrompt(data) }],
    });

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ report: message.content[0].text }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

function buildPrompt(d) {
  return `Write a personalized home-buying assessment for this first-time buyer. Use exactly 4 paragraphs with these exact headings (bold, on their own line):

**Your Current Standing**
**Your Strengths**
**Challenges to Address**
**Your Recommended Next Steps**

Their profile:
- Annual Income: $${Number(d.income).toLocaleString()}
- State: ${d.state}
- Home Price Target: $${Number(d.homePriceTarget).toLocaleString()}
- Available Down Payment: $${Number(d.downPayment).toLocaleString()} (${Number(d.dpPct).toFixed(1)}% of target)
- Monthly Debt Payments: $${Number(d.monthlyDebts).toLocaleString()}
- Max Monthly Housing Budget: $${Number(d.monthlyCapacity).toLocaleString()}
- Debt-to-Income Ratio: ${Number(d.dti).toFixed(1)}%
- Recommended Loan: ${d.loanProgram}
- Employment Type: ${d.employmentType || 'W-2 employee'}
- Months Until Down Payment Ready: ${d.monthsToReady === 0 ? 'Ready now' : d.monthsToReady}
- State Assistance Program: ${d.stateProgram}

Be specific to their exact numbers. No bullet points — flowing paragraphs only.`;
}
