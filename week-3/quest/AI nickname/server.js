require("dotenv").config();
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 닉네임 + 캐릭터 카드 생성 API
app.post("/api/generate", async (req, res) => {
  try {
    const { name, personality, hobbies, special, moods } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "이름을 입력해주세요." });
    }

    const moodLabels = {
      cool: "멋진/쿨한",
      pretty: "예쁜/아름다운",
      funny: "재밌는/유머러스한",
      cute: "귀여운/사랑스러운",
      dark: "다크/어두운",
      mysterious: "신비로운/미스터리한",
      powerful: "강한/파워풀한",
      chill: "편안한/여유로운",
    };

    const moodText =
      moods && moods.length > 0
        ? moods.map((m) => moodLabels[m] || m).join(", ")
        : "다양한 스타일";

    const prompt = `당신은 창의적인 닉네임 전문가입니다. 아래 정보를 바탕으로 닉네임 8개를 만들어주세요.

[사용자 정보]
- 이름: ${name}
- 성격: ${personality || "미입력"}
- 취미: ${hobbies || "미입력"}
- 특이사항: ${special || "미입력"}
- 원하는 느낌: ${moodText}

[요구사항]
각 닉네임마다 아래 JSON 형식으로 응답해주세요:
1. nickname: 창의적인 닉네임 (한국어, 영어, 혼합 모두 가능)
2. tag: 닉네임의 영감 출처 ("성격 기반", "취미 기반", "특이사항", "영한 믹스", "종합" 중 하나)
3. description: 이 닉네임을 만든 이유를 한 줄로 설명
4. character: 이 닉네임에 어울리는 캐릭터 카드 정보
   - emoji: 캐릭터를 대표하는 이모지 1개
   - title: 캐릭터 칭호 (예: "불꽃의 수호자", "달빛 몽상가")
   - personality: 캐릭터 성격 한 줄
   - skill: 캐릭터 특기/능력 한 줄
   - quote: 캐릭터의 대사 한 줄 (따옴표 포함)
   - color: 캐릭터 테마 색상 (tailwind color name: red, blue, purple, pink, amber, emerald, cyan, violet, rose, indigo, teal, orange 중 하나)

반드시 아래 형식의 JSON 배열만 응답하세요. 다른 텍스트는 포함하지 마세요:
[
  {
    "nickname": "...",
    "tag": "...",
    "description": "...",
    "character": {
      "emoji": "...",
      "title": "...",
      "personality": "...",
      "skill": "...",
      "quote": "...",
      "color": "..."
    }
  }
]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 1.0,
      max_tokens: 2500,
    });

    const content = completion.choices[0].message.content.trim();

    // JSON 파싱 (코드블록 제거)
    const jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const nicknames = JSON.parse(jsonStr);

    res.json({ nicknames });
  } catch (err) {
    console.error("Error:", err.message);
    if (err.message.includes("API key")) {
      return res.status(401).json({ error: "OpenAI API 키가 유효하지 않습니다." });
    }
    res.status(500).json({ error: "닉네임 생성 중 오류가 발생했습니다. 다시 시도해주세요." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✨ AI 닉네임 생성기 서버 실행 중: http://localhost:${PORT}`);
});
