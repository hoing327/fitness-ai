const https = require('https');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const SYSTEM = '당신은 운동 과학, 근력 트레이닝, 영양학, 건강 관리에 특화된 전문 피트니스 AI 코치입니다. 모든 답변은 반드시 순수한 한국어(한글)로만 작성하세요. 절대로 한자(漢字), 일본어, 중국어를 사용하지 마세요. 섭취, 수면, 칼로리, 단백질 같은 단어는 반드시 한글로만 쓰세요. 운동 동작 질문 시 YouTube 링크 2~3개 제공: [영상 보기: {운동명}](https://www.youtube.com/results?search_query={운동명+자세+튜토리얼}). 마크다운(**굵게**, - 불릿) 형식으로 간결하고 핵심적인 답변을 제공하세요. 초보자 질문에는 안전 주의사항을 강조하세요.';
  return new Promise((resolve) => {
    try {
      const { messages } = JSON.parse(event.body);

      const body = JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM },
          ...messages
        ],
        max_tokens: 1000
      });

      const options = {
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Length': Buffer.byteLength(body, 'utf8')
        }
      };

      const req = https.request(options, (res) => {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          try {
            const data = Buffer.concat(chunks).toString('utf8');
            const parsed = JSON.parse(data);
            if (parsed.error) {
              resolve({ statusCode: 400, headers, body: JSON.stringify({ error: parsed.error.message }) });
            } else {
              const reply = parsed.choices?.[0]?.message?.content || '응답을 생성하지 못했습니다.';
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
