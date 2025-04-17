// 算命学の本格的なロジックをここに実装
// 干支（十干・十二支）計算、命式算出、性格・運勢分析

const Lunar = require('lunar-javascript').Lunar;

function calcGanzhi(birthday) {
    // lunar-javascriptで年柱・月柱・日柱を正確に算出
    const date = new Date(birthday);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const lunar = Lunar.fromYmd(year, month, day);
    return {
        year: lunar.getYearInGanZhi(),
        month: lunar.getMonthInGanZhi(),
        day: lunar.getDayInGanZhi(),
        hour: '庚午' // 時柱は暫定
    };
}

function calcMeishiki(birthday, gender) {
    // lunar-javascriptで年・月・日干支を取得
    const date = new Date(birthday);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const lunar = Lunar.fromYmd(year, month, day);
    const ganzhiYear = lunar.getYearInGanZhi();
    const ganzhiMonth = lunar.getMonthInGanZhi();
    const ganzhiDay = lunar.getDayInGanZhi();
    // 五行・陰陽対応表
    const gogyou = {
        '甲': '木', '乙': '木',
        '丙': '火', '丁': '火',
        '戊': '土', '己': '土',
        '庚': '金', '辛': '金',
        '壬': '水', '癸': '水'
    };
    const yinYangMap = {
        '甲': '陽', '乙': '陰', '丙': '陽', '丁': '陰', '戊': '陽', '己': '陰',
        '庚': '陽', '辛': '陰', '壬': '陽', '癸': '陰'
    };
    const getEl = (kan) => gogyou[kan] || '';
    const getYy = (kan) => yinYangMap[kan] || '';
    return {
        year: { ganzhi: ganzhiYear, element: getEl(ganzhiYear[0]), yinYang: getYy(ganzhiYear[0]) },
        month: { ganzhi: ganzhiMonth, element: getEl(ganzhiMonth[0]), yinYang: getYy(ganzhiMonth[0]) },
        day: { ganzhi: ganzhiDay, element: getEl(ganzhiDay[0]), yinYang: getYy(ganzhiDay[0]) },
        hour: { ganzhi: '庚午', element: '金', yinYang: '陽' }, // 時柱は暫定
        gender,
        // --- 人体星図（9マス）サンプル ---
        bodyStars: {
            center: '調舒星',
            left: '車騎星',
            right: '車騎星',
            top: '禄存星',
            bottom: '天南星',
            leftTop: '天胡星',
            rightTop: '天将星',
            leftBottom: '龍高星',
            rightBottom: '天将星'
        }
    };
}

function analyzePersonality(meishiki) {
    // 年柱・月柱・日柱の五行でバランスを算出
    const elements = [meishiki.year.element, meishiki.month.element, meishiki.day.element];
    const balance = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    elements.forEach(el => { if (balance[el] !== undefined) balance[el]++; });
    const elementBalance = `木${balance['木']}・火${balance['火']}・土${balance['土']}・金${balance['金']}・水${balance['水']}`;
    // 陰陽も年・月・日で
    const yinCount = [meishiki.year.yinYang, meishiki.month.yinYang, meishiki.day.yinYang].filter(v=>v==='陰').length;
    const yangCount = 3 - yinCount;
    const yinYang = yangCount > yinCount ? '陽が強い' : yinCount > yangCount ? '陰が強い' : 'バランス型';
    // コメント例
    let comment = '';
    if (balance['木'] >= 2) comment = '成長志向・クリエイティブ';
    else if (balance['火'] >= 2) comment = '情熱的・エネルギッシュ';
    else if (balance['土'] >= 2) comment = '堅実・信頼されやすい';
    else if (balance['金'] >= 2) comment = '知的・合理的';
    else if (balance['水'] >= 2) comment = '柔軟・社交的';
    else comment = 'バランス型タイプ';
    return {
        summary: `あなたの五行バランスは「${elementBalance}」で、${yinYang}です。`,
        details: {
            elementBalance,
            yinYang,
            comment
        }
    };
}

function analyzeFortune(meishiki) {
    // 五行バランスと陰陽で運勢を分岐
    const elements = [meishiki.year.element, meishiki.month.element, meishiki.day.element];
    const balance = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    elements.forEach(el => { if (balance[el] !== undefined) balance[el]++; });
    const yinCount = [meishiki.year.yinYang, meishiki.month.yinYang, meishiki.day.yinYang].filter(v=>v==='陰').length;
    const yangCount = 3 - yinCount;
    // 年柱干支の組み合わせも利用
    const yearKan = meishiki.year.ganzhi[0];
    const yearZhi = meishiki.year.ganzhi[1];

    // 総合運
    let yearFortune = '';
    if (balance['木'] >= 2) yearFortune = '今年は成長や新たな挑戦が吉。積極的に動くと運気上昇。';
    else if (balance['火'] >= 2) yearFortune = '情熱や行動力が評価される年。思い切った決断が吉。';
    else if (balance['土'] >= 2) yearFortune = '安定と信頼がテーマ。地道な努力が実を結ぶ年。';
    else if (balance['金'] >= 2) yearFortune = '知的活動や新しい知識の吸収が運気を高めます。';
    else if (balance['水'] >= 2) yearFortune = '柔軟な対応や人脈が幸運を呼びます。';
    else yearFortune = 'バランス型の年。多方面にチャンスあり。';

    // 恋愛運
    let love = '';
    if (yearKan === '甲' || yearKan === '丙') love = '新しい出会いが期待できる年。積極的なアプローチが吉。';
    else if (yearKan === '乙' || yearKan === '丁') love = '穏やかな関係を大切に。信頼を深めると良縁に。';
    else if (yearKan === '庚' || yearKan === '辛') love = '知的な会話や共通の趣味が恋愛運を高めます。';
    else love = '自然体でいることが恋愛運アップの鍵。';

    // 仕事運
    let work = '';
    if (yangCount > yinCount) work = '行動力と決断力が評価され、昇進や成果に繋がる年。';
    else if (yinCount > yangCount) work = 'サポート役や裏方での努力が認められる年。';
    else work = 'バランス感覚を活かすと仕事運が安定。';

    // 健康運
    let health = '';
    if (balance['火'] >= 2) health = '体力充実。スポーツや運動でさらに健康運アップ。';
    else if (balance['水'] === 0) health = '水分補給や休息を意識して。無理は禁物。';
    else health = '大きなトラブルは少ないが、生活リズムを整えて吉。';

    return {
        yearFortune,
        love,
        work,
        health
    };
}

module.exports = {
    calcGanzhi,
    calcMeishiki,
    analyzePersonality,
    analyzeFortune
};
