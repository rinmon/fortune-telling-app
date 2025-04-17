// 本格的な算命学ロジックを含むコントローラー
const { calcGanzhi, calcMeishiki, analyzePersonality, analyzeFortune } = require('../utils/fortuneLogic');

// 占いAPIのコントローラー
exports.getFortune = (req, res) => {
    const { birthday, gender, theme } = req.body;
    if (!birthday || !gender) {
        return res.status(400).json({ error: '生年月日と性別は必須です' });
    }
    try {
        // 干支・命式計算
        const ganzhi = calcGanzhi(birthday);
        const meishiki = calcMeishiki(birthday, gender);
        // 性格分析・運勢分析
        const personality = analyzePersonality(meishiki);
        // テーマごとに運勢分析
        let fortune;
        if (theme === 'love') {
            fortune = { love: analyzeFortune(meishiki).love };
        } else if (theme === 'work') {
            fortune = { work: analyzeFortune(meishiki).work };
        } else if (theme === 'health') {
            fortune = { health: analyzeFortune(meishiki).health };
        } else {
            fortune = analyzeFortune(meishiki); // 総合
        }
        // 仮の9マス星名（本実装時は命式から計算）
        const bodyStars = [
            '貫索星', '石門星', '鳳閣星',
            '調舒星', '禄存星', '司禄星',
            '車騎星', '牽牛星', '龍高星'
        ];
        res.json({
            birthday,
            gender,
            ganzhi,
            meishiki,
            personality,
            fortune,
            bodyStars
        });
    } catch (e) {
        res.status(500).json({ error: '占い処理中にエラーが発生しました', details: e.message });
    }
};
