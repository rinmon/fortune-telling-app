const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const CryptoJS = require('crypto-js');

// ユーザーデータのディレクトリパス
const usersDir = path.join(__dirname, '..', 'data', 'users');

// 秘密鍵（実際の環境では環境変数として設定することをお勧めします）
const SECRET_KEY = process.env.SECRET_KEY || 'sanmeigaku-secret-key';

// 十干（じっかん）の定義
const jikkan = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];

// 十二支（じゅうにし）の定義
const junishi = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

// 五行（ごぎょう）の定義
const gogyou = {
  "甲": "木", "乙": "木",
  "丙": "火", "丁": "火",
  "戊": "土", "己": "土",
  "庚": "金", "辛": "金",
  "壬": "水", "癸": "水"
};

// 季節の五行
const seasonElement = {
  0: "水", 1: "水",  // 冬（12月〜2月）
  2: "木", 3: "木", 4: "木",  // 春（3月〜5月）
  5: "火", 6: "火", 7: "火",  // 夏（6月〜8月）
  8: "土", 9: "土", 10: "土", 11: "水"  // 秋と初冬（9月〜11月、12月）
};

// 干支から基本的な性格特性を取得
function getPersonalityFromKanshi(heavenlyStem, earthlyBranch) {
  const personality = {
    strengths: [],
    weaknesses: [],
    traits: []
  };
  
  // 十干（天干）による特性
  switch(heavenlyStem) {
    case "甲":
      personality.traits.push("リーダーシップがある", "行動力がある", "決断力がある");
      personality.strengths.push("目標に向かって突き進む力", "自己主張が強い");
      personality.weaknesses.push("頑固さ", "柔軟性に欠けることがある");
      break;
    case "乙":
      personality.traits.push("柔軟", "細やか", "協調性がある");
      personality.strengths.push("調和を重んじる", "忍耐強い");
      personality.weaknesses.push("優柔不断", "受動的になることがある");
      break;
    case "丙":
      personality.traits.push("情熱的", "明るい", "活発");
      personality.strengths.push("人を引き付ける魅力", "エネルギッシュ");
      personality.weaknesses.push("短気", "飽きっぽい");
      break;
    case "丁":
      personality.traits.push("感受性が豊か", "優しい", "共感力がある");
      personality.strengths.push("人の気持ちを理解する力", "繊細な配慮");
      personality.weaknesses.push("傷つきやすい", "感情に流されやすい");
      break;
    case "戊":
      personality.traits.push("誠実", "安定感がある", "信頼できる");
      personality.strengths.push("地道な努力を続ける力", "実直さ");
      personality.weaknesses.push("保守的", "変化を好まない");
      break;
    case "己":
      personality.traits.push("思慮深い", "几帳面", "計画的");
      personality.strengths.push("緻密な分析力", "冷静な判断力");
      personality.weaknesses.push("心配性", "完璧主義");
      break;
    case "庚":
      personality.traits.push("強い意志", "公正", "規律正しい");
      personality.strengths.push("正義感", "責任感");
      personality.weaknesses.push("融通が利かない", "厳格すぎることがある");
      break;
    case "辛":
      personality.traits.push("美的センスがある", "洗練されている", "鋭い");
      personality.strengths.push("審美眼", "先見の明");
      personality.weaknesses.push("批判的", "理想を追求しすぎる");
      break;
    case "壬":
      personality.traits.push("独創的", "先進的", "アイデアマン");
      personality.strengths.push("創造力", "適応力");
      personality.weaknesses.push("現実離れしている", "計画性に欠ける");
      break;
    case "癸":
      personality.traits.push("直感的", "柔和", "繊細");
      personality.strengths.push("豊かな想像力", "共感力");
      personality.weaknesses.push("依存的", "現実逃避");
      break;
  }
  
  // 十二支（地支）による特性
  switch(earthlyBranch) {
    case "子":
      personality.traits.push("賢い", "器用", "活動的");
      personality.strengths.push("機知に富む", "好奇心旺盛");
      personality.weaknesses.push("落ち着きがない", "浪費家");
      break;
    case "丑":
      personality.traits.push("堅実", "忍耐強い", "勤勉");
      personality.strengths.push("地道な努力", "責任感");
      personality.weaknesses.push("頑固", "変化を嫌う");
      break;
    case "寅":
      personality.traits.push("勇敢", "情熱的", "正義感が強い");
      personality.strengths.push("リーダーシップ", "行動力");
      personality.weaknesses.push("短気", "自己中心的になることがある");
      break;
    case "卯":
      personality.traits.push("穏やか", "親しみやすい", "平和主義");
      personality.strengths.push("調和を重んじる", "外交的手腕");
      personality.weaknesses.push("優柔不断", "現実逃避");
      break;
    case "辰":
      personality.traits.push("才能豊か", "野心的", "カリスマ性がある");
      personality.strengths.push("総合的な能力", "順応性");
      personality.weaknesses.push("過度な自信", "投げやり");
      break;
    case "巳":
      personality.traits.push("知的", "分析力に優れる", "直感力がある");
      personality.strengths.push("洞察力", "判断力");
      personality.weaknesses.push("疑い深い", "執着心が強い");
      break;
    case "午":
      personality.traits.push("活発", "社交的", "明るい");
      personality.strengths.push("コミュニケーション能力", "適応力");
      personality.weaknesses.push("気分屋", "不安定");
      break;
    case "未":
      personality.traits.push("芸術的", "優雅", "思いやりがある");
      personality.strengths.push("創造性", "共感力");
      personality.weaknesses.push("優柔不断", "現実感覚の欠如");
      break;
    case "申":
      personality.traits.push("機知に富む", "多才", "柔軟性がある");
      personality.strengths.push("問題解決能力", "適応力");
      personality.weaknesses.push("落ち着きがない", "不誠実になることがある");
      break;
    case "酉":
      personality.traits.push("几帳面", "完璧主義", "誠実");
      personality.strengths.push("緻密さ", "美的センス");
      personality.weaknesses.push("批判的", "神経質");
      break;
    case "戌":
      personality.traits.push("忠実", "誠実", "責任感がある");
      personality.strengths.push("信頼性", "忍耐力");
      personality.weaknesses.push("頑固", "心配性");
      break;
    case "亥":
      personality.traits.push("独立心が強い", "公平", "理性的");
      personality.strengths.push("知性", "洞察力");
      personality.weaknesses.push("孤独を好む", "感情表現が苦手");
      break;
  }
  
  return personality;
}

// 干支の相性から恋愛運を判断
function getLoveCompatibility(personKanshi, partnerKanshi) {
  // ここでは単純化のため、五行の相性で判断
  const personElement = gogyou[personKanshi.charAt(0)];
  const partnerElement = gogyou[partnerKanshi.charAt(0)];
  
  // 五行の相性：相生（そうじょう）と相剋（そうこく）
  const compatibility = {
    // 相生関係（プラスの影響）
    // 木は火を生む、火は土を生む、土は金を生む、金は水を生む、水は木を生む
    "木": { "火": 90, "土": 50, "金": 30, "水": 70, "木": 60 },
    "火": { "木": 70, "土": 90, "金": 40, "水": 30, "火": 60 },
    "土": { "木": 40, "火": 70, "金": 90, "水": 50, "土": 60 },
    "金": { "木": 30, "火": 40, "土": 70, "水": 90, "金": 60 },
    "水": { "木": 90, "火": 30, "土": 40, "金": 70, "水": 60 }
  };
  
  const score = compatibility[personElement][partnerElement];
  let result = "";
  
  if (score >= 80) {
    result = "とても相性が良い";
  } else if (score >= 60) {
    result = "相性が良い";
  } else if (score >= 40) {
    result = "普通の相性";
  } else {
    result = "相性があまり良くない";
  }
  
  return {
    score,
    result,
    advice: getAdviceForLove(score)
  };
}

// 恋愛運のアドバイス
function getAdviceForLove(score) {
  if (score >= 80) {
    return "お互いを高め合える関係です。素直な気持ちで接することで、さらに絆が深まるでしょう。";
  } else if (score >= 60) {
    return "基本的に良好な関係を築けますが、時には譲り合いの精神が必要です。";
  } else if (score >= 40) {
    return "互いの違いを理解し、尊重することで関係は改善します。コミュニケーションを大切にしましょう。";
  } else {
    return "理解し合うのに時間がかかるかもしれません。相手の立場に立って考えることが大切です。";
  }
}

// 日付から干支を算出
function calculateKanshi(birthdate) {
  const date = new Date(birthdate);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // 年の干支計算（単純化）
  const heavenlyStemIndex = (year - 4) % 10;
  const earthlyBranchIndex = (year - 4) % 12;
  
  const heavenlyStem = jikkan[heavenlyStemIndex];
  const earthlyBranch = junishi[earthlyBranchIndex];
  
  return {
    year: `${heavenlyStem}${earthlyBranch}`,
    month: calculateMonthKanshi(year, month),
    day: calculateDayKanshi(year, month, day)
  };
}

// 月の干支計算（簡易版）
function calculateMonthKanshi(year, month) {
  // 月の干支は年の干支と関連付けられる（単純化）
  const baseIndex = ((year - 4) % 5) * 2;
  let monthHeavenlyStemIndex = (baseIndex + (month - 1)) % 10;
  const monthEarthlyBranchIndex = (month + 1) % 12;
  
  return `${jikkan[monthHeavenlyStemIndex]}${junishi[monthEarthlyBranchIndex]}`;
}

// 日の干支計算（簡易版）
function calculateDayKanshi(year, month, day) {
  // この計算は非常に簡略化しています。実際の算命学ではもっと複雑です。
  const baseIndex = Math.floor((year * 5 + month * 30 + day) % 60);
  const dayHeavenlyStemIndex = baseIndex % 10;
  const dayEarthlyBranchIndex = baseIndex % 12;
  
  return `${jikkan[dayHeavenlyStemIndex]}${junishi[dayEarthlyBranchIndex]}`;
}

// 基本的な運勢計算
function calculateFortune(birthdate, targetYear = new Date().getFullYear()) {
  const birthYear = new Date(birthdate).getFullYear();
  const age = targetYear - birthYear;
  
  // 年運のサイクル（単純化）
  const lifeCyclePhase = Math.floor((age % 60) / 10);
  
  const kanshi = calculateKanshi(birthdate);
  const yearElement = gogyou[kanshi.year.charAt(0)];
  const monthElement = gogyou[kanshi.month.charAt(0)];
  const dayElement = gogyou[kanshi.day.charAt(0)];
  
  // 運勢のサイクル（10年周期で変化すると仮定）
  let fortuneCycle;
  switch(lifeCyclePhase) {
    case 0: // 0-9歳
      fortuneCycle = "基礎形成期";
      break;
    case 1: // 10-19歳
      fortuneCycle = "成長期";
      break;
    case 2: // 20-29歳
      fortuneCycle = "確立期";
      break;
    case 3: // 30-39歳
      fortuneCycle = "安定期";
      break;
    case 4: // 40-49歳
      fortuneCycle = "充実期";
      break;
    case 5: // 50-59歳
      fortuneCycle = "収穫期";
      break;
    default: // 60歳以上
      fortuneCycle = "円熟期";
  }
  
  // 今年の運勢（単純化）
  const currentYearStem = jikkan[(targetYear - 4) % 10];
  const currentYearElement = gogyou[currentYearStem];
  
  // 五行の相性で運勢を簡易計算
  const compatibilityScores = {
    // 相生関係（プラスの影響）- 木は火を生む、火は土を生む、土は金を生む、金は水を生む、水は木を生む
    "木": { "火": 85, "土": 60, "金": 40, "水": 75, "木": 65 },
    "火": { "木": 75, "土": 85, "金": 45, "水": 40, "火": 65 },
    "土": { "木": 45, "火": 75, "金": 85, "水": 55, "土": 65 },
    "金": { "木": 40, "火": 45, "土": 75, "水": 85, "金": 65 },
    "水": { "木": 85, "火": 40, "土": 45, "金": 75, "水": 65 }
  };
  
  // 全体運
  const overallScore = compatibilityScores[yearElement][currentYearElement];
  let overallFortune;
  
  if (overallScore >= 80) {
    overallFortune = "非常に良い";
  } else if (overallScore >= 70) {
    overallFortune = "良い";
  } else if (overallScore >= 60) {
    overallFortune = "まずまず";
  } else if (overallScore >= 50) {
    overallFortune = "普通";
  } else {
    overallFortune = "やや注意";
  }
  
  // 仕事運（日の干支とその年の相性から）
  const workScore = compatibilityScores[dayElement][currentYearElement];
  let workFortune;
  
  if (workScore >= 80) {
    workFortune = "非常に良い";
  } else if (workScore >= 70) {
    workFortune = "良い";
  } else if (workScore >= 60) {
    workFortune = "まずまず";
  } else if (workScore >= 50) {
    workFortune = "普通";
  } else {
    workFortune = "やや注意";
  }
  
  // 恋愛運（月の干支とその年の相性から）
  const loveScore = compatibilityScores[monthElement][currentYearElement];
  let loveFortune;
  
  if (loveScore >= 80) {
    loveFortune = "非常に良い";
  } else if (loveScore >= 70) {
    loveFortune = "良い";
  } else if (loveScore >= 60) {
    loveFortune = "まずまず";
  } else if (loveScore >= 50) {
    loveFortune = "普通";
  } else {
    loveFortune = "やや注意";
  }
  
  // 健康運（年の干支とその年の月の相性から）
  const currentMonth = new Date().getMonth();
  const seasonElem = seasonElement[currentMonth];
  const healthScore = compatibilityScores[yearElement][seasonElem];
  let healthFortune;
  
  if (healthScore >= 80) {
    healthFortune = "非常に良い";
  } else if (healthScore >= 70) {
    healthFortune = "良い";
  } else if (healthScore >= 60) {
    healthFortune = "まずまず";
  } else if (healthScore >= 50) {
    healthFortune = "普通";
  } else {
    healthFortune = "やや注意";
  }
  
  return {
    kanshi,
    fortuneCycle,
    overall: {
      score: overallScore,
      result: overallFortune,
      advice: getFortuneAdvice(overallScore, "overall")
    },
    work: {
      score: workScore,
      result: workFortune,
      advice: getFortuneAdvice(workScore, "work")
    },
    love: {
      score: loveScore,
      result: loveFortune,
      advice: getFortuneAdvice(loveScore, "love")
    },
    health: {
      score: healthScore,
      result: healthFortune,
      advice: getFortuneAdvice(healthScore, "health")
    }
  };
}

// 運勢に基づくアドバイス
function getFortuneAdvice(score, type) {
  const advices = {
    overall: {
      high: "全体的に運気が高まっています。新しいことに挑戦するのに良い時期です。",
      medium: "安定した運気です。計画的に行動すれば良い結果が得られるでしょう。",
      low: "今は時期を待つことも大切です。無理をせず、基盤を固める活動に集中しましょう。"
    },
    work: {
      high: "仕事面での成果が表れやすい時期です。積極的に意見を出し、新しいプロジェクトに取り組むと良いでしょう。",
      medium: "堅実な仕事ぶりが評価される時期です。地道な努力を続けましょう。",
      low: "今は目立った成果を求めるより、スキルアップや人間関係の構築に力を入れると良いでしょう。"
    },
    love: {
      high: "恋愛運が高まっています。素直な気持ちで接することで、良い関係が築けるでしょう。",
      medium: "穏やかな恋愛運です。焦らず自然体で過ごすことが大切です。",
      low: "恋愛面では慎重さが必要な時期です。相手をよく観察し、理解を深めることに集中しましょう。"
    },
    health: {
      high: "健康面は良好です。この調子を維持するため、適度な運動や栄養バランスの良い食事を心がけましょう。",
      medium: "体調は安定していますが、疲れが溜まりやすい時期かもしれません。十分な休息を取りましょう。",
      low: "健康面に注意が必要です。無理をせず、規則正しい生活を心がけ、早め早めの対処を。"
    }
  };
  
  if (score >= 70) {
    return advices[type].high;
  } else if (score >= 50) {
    return advices[type].medium;
  } else {
    return advices[type].low;
  }
}

// 性格分析API
router.post('/personality', (req, res) => {
  try {
    const { birthdate } = req.body;
    
    if (!birthdate) {
      return res.status(400).json({ success: false, message: '生年月日が必要です' });
    }
    
    const kanshi = calculateKanshi(birthdate);
    const personality = getPersonalityFromKanshi(kanshi.year.charAt(0), kanshi.year.charAt(1));
    
    res.json({
      success: true,
      kanshi,
      personality
    });
  } catch (error) {
    console.error('性格分析エラー:', error);
    res.status(500).json({ success: false, message: 'サーバーエラーが発生しました' });
  }
});

// 総合運勢API
router.post('/fortune', (req, res) => {
  try {
    const { userId, birthdate, targetYear } = req.body;
    
    if (!birthdate) {
      return res.status(400).json({ success: false, message: '生年月日が必要です' });
    }
    
    const fortune = calculateFortune(birthdate, targetYear || new Date().getFullYear());
    
    // ユーザーIDがある場合は結果を保存
    if (userId) {
      const userFilePath = path.join(usersDir, `${userId}.json`);
      
      if (fs.existsSync(userFilePath)) {
        // ファイル読み込み
        const encryptedData = JSON.parse(fs.readFileSync(userFilePath, 'utf8')).data;
        
        // データ復号化
        const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
        let userData = JSON.parse(decryptedBytes.toString(CryptoJS.enc.Utf8));
        
        // 運勢記録を追加
        userData.readings.push({
          type: 'fortune',
          date: new Date().toISOString(),
          result: fortune
        });
        
        // データ暗号化して保存
        const encryptedUpdatedData = CryptoJS.AES.encrypt(
          JSON.stringify(userData),
          SECRET_KEY
        ).toString();
        
        fs.writeFileSync(userFilePath, JSON.stringify({ data: encryptedUpdatedData }));
      }
    }
    
    res.json({
      success: true,
      fortune
    });
  } catch (error) {
    console.error('運勢計算エラー:', error);
    res.status(500).json({ success: false, message: 'サーバーエラーが発生しました' });
  }
});

// 恋愛相性API
router.post('/compatibility', (req, res) => {
  try {
    const { userId, birthdate, partnerBirthdate } = req.body;
    
    if (!birthdate || !partnerBirthdate) {
      return res.status(400).json({ success: false, message: '両者の生年月日が必要です' });
    }
    
    const personKanshi = calculateKanshi(birthdate).year;
    const partnerKanshi = calculateKanshi(partnerBirthdate).year;
    const compatibility = getLoveCompatibility(personKanshi, partnerKanshi);
    
    // ユーザーIDがある場合は結果を保存
    if (userId) {
      const userFilePath = path.join(usersDir, `${userId}.json`);
      
      if (fs.existsSync(userFilePath)) {
        // ファイル読み込み
        const encryptedData = JSON.parse(fs.readFileSync(userFilePath, 'utf8')).data;
        
        // データ復号化
        const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
        let userData = JSON.parse(decryptedBytes.toString(CryptoJS.enc.Utf8));
        
        // 相性記録を追加
        userData.readings.push({
          type: 'compatibility',
          date: new Date().toISOString(),
          partnerBirthdate,
          result: { personKanshi, partnerKanshi, compatibility }
        });
        
        // データ暗号化して保存
        const encryptedUpdatedData = CryptoJS.AES.encrypt(
          JSON.stringify(userData),
          SECRET_KEY
        ).toString();
        
        fs.writeFileSync(userFilePath, JSON.stringify({ data: encryptedUpdatedData }));
      }
    }
    
    res.json({
      success: true,
      personKanshi,
      partnerKanshi,
      compatibility
    });
  } catch (error) {
    console.error('相性計算エラー:', error);
    res.status(500).json({ success: false, message: 'サーバーエラーが発生しました' });
  }
});

module.exports = router;
