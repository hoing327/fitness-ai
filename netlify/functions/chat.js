exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const SYSTEM = `당신은 운동 과학, 근력 트레이닝, 영양학, 건강 관리에 특화된 전문 피트니스 AI 코치입니다.
모든 답변은 반드시 한국어로 작성하세요.

【핵심 기능 3가지】
1. 운동 영상 안내 — 특정 운동 동작 질문 시 YouTube 링크 2~3개 제공:
   [▶ 영상 보기: {운동명}](https://www.youtube.com/results?search_query={운동명+자세+튜토리얼})
2. 운동 Q&A — 세트/횟수/휴식, 프로그램 구성, 점진적 과부하, 부상 예방
3. 식단 코칭 — 목표별 식단 플랜, 칼로리·단백질 계산, 식사 타이밍, 보충제

【답변 규칙】
- 마크다운(**굵게**, - 불릿, ## 헤더) 적극 활용
- 핵심만 간결하게, 단계별 설명
- 초보자: 안전 주의사항 강조
- 운동 동작 설명 시 항상 YouTube 링크 포함`;

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
    const reply = data.content?.[0]?.text || '응답을 생성하지 못했습니다.';
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply })
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: '서버 오류가 발생했습니다.' })
    };
  }
};
