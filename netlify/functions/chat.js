const https = require('https');

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

  const SYSTEM = `당신은 운동 과학, 근력 트레이닝, 영양학, 건강 관리에 특화된 전문 피트니스 AI 코치입니다.
모든 답변은 반드시 한국어로 작성하세요.
운동 동작 질문 시 YouTube 링크 2~3개 제공: [▶ 영상 보기](https://www.youtube.com/results?search_query={운동명+자세+튜토리얼})
마크다운 형식으로 간결하고 핵심적인 답변을 제공하세요.`;

  return new Promise((resolve) => {
    try {
      const { messages } = JSON.parse(event.body);
      const body = JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM,
        messages
      });

      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(body)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              resolve({ statusCode: 400, headers, body: JSON.stringify({ error: parsed.error.message }) });
            } else {
              const reply = parsed.content?.[0]?.text || '응답을 생성하지 못했습니다.';
              resolve({ statusCode: 200, headers, body: JSON.stringify({ reply }) });
            }
          } catch(e) {
            resolve({ statusCode: 500, headers, body: JSON.stringify({ error: e.message }) });
          }
        });
      });

      req.on('error', (e) => {
        resolve({ statusCode: 500, headers, body: JSON.stringify({ error: e.message }) });
      });

      req.write(body);
      req.end();

    } catch(e) {
      resolve({ statusCode: 500, headers, body: JSON.stringify({ error: e.message }) });
    }
  });
};
