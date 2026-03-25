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

  const SYSTEM = `당신은 피트니스 AI 코치입니다. 아래 규칙을 반드시 지키세요.

[절대 규칙]
1. 모든 답변은 오직 한국어(한글)로만 작성하세요.
2. 한자(漢字), 중국어, 일본어, 태국어, 아랍어 등 외국 문자를 절대 사용하지 마세요.
3. 영어 단어도 사용하지 마세요. 영어 대신 한국어로 쓰세요.
   - komplex -> 복합
   - protein -> 단백질
   - calorie -> 칼로리
   - regular -> 규칙적으로
   - intake -> 섭취
   - sleep -> 수면
   - exercise -> 운동
4. 답변에 한글, 숫자, 문장부호만 사용하세요.

[답변 방식]
- 마크다운 형식으로 간결하게 답변
- 운동 동작 질문 시 유튜브 링크 제공: [영상 보기: 운동명](https://www.youtube.com/results?search_query=운동명+자세+튜토리얼)
- 초보자 질문에는 안전 주의사항 포함`;
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
