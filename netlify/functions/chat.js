exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  const SYSTEM = `당신은 운동 과학, 근력 트레이닝, 영양학, 건강 관리에 특화된 전문 피트니스 AI 코치입니다.
모든 답변은 반드시 한국어로 작성하세요.
운동 동작 질문 시 YouTube 링크 2~3개 제공: [▶ 영상 보기](https://www.youtube.com/results?search_query={운동명+자세+튜토리얼})
마크다운 형식으로 간결하고 핵심적인 답변을 제공하세요.`;

  try {
    const { messages } = JSON.parse(event.body);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM,
        messages
      })
    });

    const data = await res.json();

    if (data.error) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: data.error.message })
      };
    }

    const reply = data.content?.[0]?.text || '응답을 생성하지 못했습니다.';

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply })
    };

  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e.message })
    };
  }
};
