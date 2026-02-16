// ================================================================
// cards.js — 群友大乱斗 Card Battle: All Card Data
// ================================================================

const CARD_TYPE = { COMMON: 'common', SPECIAL: 'special', CLIMAX: 'climax' };
const TAG = { SLASH: '斩击', MAGIC: '魔导', GUARD: '护卫', TACTIC: '战术', SPIRIT: '精神', CHAOS: '混沌' };

const CHARACTERS = {
    hezi: { id: 'hezi', name: '禾子', title: '十字军 Crusader', role: 'tank', emoji: '✟', color: '#f0c040', desc: '神圣虔诚坦克' },
    haiyu: { id: 'haiyu', name: '海鱼', title: '骑士 Knight', role: 'tank', emoji: '🛡', color: '#4a90d9', desc: '防守反击骑士' },
    chengl: { id: 'chengl', name: '陈桂林', title: '先锋 Vanguard', role: 'dps', emoji: '⚡', color: '#e84040', desc: '以血换血莽夫' },
    ying: { id: 'ying', name: '樱', title: '武士 Samurai', role: 'dps', emoji: '⚔', color: '#ff6b9d', desc: '拔刀术高冷武士' },
    shounao: { id: 'shounao', name: '首脑', title: '收尾人 Fixer', role: 'dps', emoji: '🎯', color: '#8b5cf6', desc: '精准清理战场' },
    dachongzi: { id: 'dachongzi', name: '大虫子', title: '魔女 Witch', role: 'mage', emoji: '🧙', color: '#a855f7', desc: '电波系高风险法师' },
    lingfeng: { id: 'lingfeng', name: '凌风', title: '星币首位 Ace of Pentacles', role: 'support', emoji: '⭐', color: '#fbbf24', desc: '撒币改变规则' },
    qiuku: { id: 'qiuku', name: '秋裤', title: '梦想家 Dreamer', role: 'support', emoji: '💭', color: '#60a5fa', desc: 'Debuff之王' },
    juhao: { id: 'juhao', name: '句号', title: '变位者 Mutant', role: 'support', emoji: '🔀', color: '#34d399', desc: '万金油复制粘贴' }
};

// ── Common Cards (3 per character) ──────────────────────────────
const COMMON_CARDS = {
    hezi_1: { id: 'hezi_1', char: 'hezi', type: CARD_TYPE.COMMON, name: '神恩痛击', tag: TAG.SLASH, ap: 2, desc: '对目标造成5点伤害，并回复自身3HP。', effect: { damage: 5, selfHeal: 3 }, quote: '"以吾之名，施以恩罚。"' },
    hezi_2: { id: 'hezi_2', char: 'hezi', type: CARD_TYPE.COMMON, name: '不退的信仰', tag: TAG.GUARD, ap: 2, desc: '获得 [护盾5点]，下次受伤转为治疗。', effect: { shield: 5, convertDmgToHeal: true }, quote: '"信仰不灭，城墙不倒。"' },
    hezi_3: { id: 'hezi_3', char: 'hezi', type: CARD_TYPE.COMMON, name: '赎罪', tag: TAG.GUARD, ap: 1, desc: '嘲讽全体。本回合未受伤则+2 AP。', effect: { taunt: true, apRefundIfNotHit: 2 }, quote: '"所有的罪孽，由我承担。"' },

    haiyu_1: { id: 'haiyu_1', char: 'haiyu', type: CARD_TYPE.COMMON, name: '盾猛', tag: TAG.SLASH, ap: 2, desc: '造成4点伤害。对有护盾目标双倍并驱散。', effect: { damage: 4, bonusVsShield: true }, quote: '"你的盾？脆得像纸。"' },
    haiyu_2: { id: 'haiyu_2', char: 'haiyu', type: CARD_TYPE.COMMON, name: '绝对防御', tag: TAG.GUARD, ap: 3, desc: '队友获得[无敌1次]，成功抵挡则反击3点。', effect: { grantInvincible: true, counterOnBlock: 3 }, quote: '"只要我在，别想过去。"' },
    haiyu_3: { id: 'haiyu_3', char: 'haiyu', type: CARD_TYPE.COMMON, name: '骑士誓约', tag: TAG.GUARD, ap: 1, desc: '造成3点伤害。被动：手牌中持有时队友减伤10%。', effect: { damage: 3, passiveReduce: 0.1 }, quote: '"誓约从不是空话。"' },

    chengl_1: { id: 'chengl_1', char: 'chengl', type: CARD_TYPE.COMMON, name: '除害', tag: TAG.SLASH, ap: 2, desc: '造成7点伤害。目标未行动过则+50%。', effect: { damage: 7, bonusVsUnacted: 0.5 }, quote: '"冲在前面的叫先锋！"' },
    chengl_2: { id: 'chengl_2', char: 'chengl', type: CARD_TYPE.COMMON, name: '肉体苦痛', tag: TAG.SLASH, ap: 1, desc: '消耗自身2HP，下次攻击必暴击(×1.5)。', effect: { selfDmg: 2, grantCrit: true }, quote: '"痛觉是最好的清醒剂。"' },
    chengl_3: { id: 'chengl_3', char: 'chengl', type: CARD_TYPE.COMMON, name: '礼貌问候', tag: TAG.SLASH, ap: 2, desc: '对目标造成3段各2点伤害。连携+2。', effect: { damage: 2, hits: 3, chainBonus: 2 }, quote: '"请多指教——三连！"' },

    ying_1: { id: 'ying_1', char: 'ying', type: CARD_TYPE.COMMON, name: '燕返·一闪', tag: TAG.SLASH, ap: 2, desc: '造成5点伤害。本回合首张牌必暴(×1.5)。', effect: { damage: 5, critIfFirst: true }, quote: '"一刀足矣。"' },
    ying_2: { id: 'ying_2', char: 'ying', type: CARD_TYPE.COMMON, name: '居合·镜花', tag: TAG.SLASH, ap: 1, desc: '进入[居合]。下回合攻击伤害×2且无法闪避。', effect: { enterIai: true }, quote: '"等着，下一刀你接不住。"' },
    ying_3: { id: 'ying_3', char: 'ying', type: CARD_TYPE.COMMON, name: '落樱', tag: TAG.SLASH, ap: 2, desc: '对全体敌方造成2点伤害+1层[出血]。', effect: { aoeDamage: 2, bleed: 1 }, quote: '"花瓣落下时——已经结束了。"' },

    shounao_1: { id: 'shounao_1', char: 'shounao', type: CARD_TYPE.COMMON, name: '定点清除', tag: TAG.TACTIC, ap: 2, desc: '攻击敌方HP最低者，造成5点伤害。击杀+2AP。', effect: { damage: 5, targetLowest: true, apOnKill: 2 }, quote: '"战场清理，交给我。"' },
    shounao_2: { id: 'shounao_2', char: 'shounao', type: CARD_TYPE.COMMON, name: '缄默协议', tag: TAG.TACTIC, ap: 2, desc: '造成4点伤害，令目标下回合无法用特殊卡。', effect: { damage: 4, silenceSpecial: true }, quote: '"嘘——机密。"' },
    shounao_3: { id: 'shounao_3', char: 'shounao', type: CARD_TYPE.COMMON, name: '合同终结', tag: TAG.TACTIC, ap: 0, desc: '消耗全部AP，每点AP造成3点伤害。', effect: { consumeAllAP: true, damagePerAP: 3 }, quote: '"合同到期——连本带利。"' },

    dachongzi_1: { id: 'dachongzi_1', char: 'dachongzi', type: CARD_TYPE.COMMON, name: '糖果诅咒', tag: TAG.MAGIC, ap: 2, desc: '造成4点伤害，50%概率变[绵羊]1回合。', effect: { damage: 4, polymorphChance: 0.5 }, quote: '"吃颗糖~变小绵羊吧。"' },
    dachongzi_2: { id: 'dachongzi_2', char: 'dachongzi', type: CARD_TYPE.COMMON, name: '扫把全垒打', tag: TAG.MAGIC, ap: 2, desc: '全体敌方3点伤害，击退至后排。', effect: { aoeDamage: 3, knockback: true }, quote: '"本垒打——出界了！！"' },
    dachongzi_3: { id: 'dachongzi_3', char: 'dachongzi', type: CARD_TYPE.COMMON, name: '禁忌书页', tag: TAG.MAGIC, ap: 1, desc: '抽2张临时牌，但下回合我方受伤+20%。', effect: { drawCards: 2, teamVulnerable: 0.2 }, quote: '"知识的代价？管他呢。"' },

    lingfeng_1: { id: 'lingfeng_1', char: 'lingfeng', type: CARD_TYPE.COMMON, name: '钞能力', tag: TAG.TACTIC, ap: 2, desc: '随机获得一张别人的特殊卡(临时)。', effect: { buyRandomSpecial: true }, quote: '"钱能解决的都是小问题。"' },
    lingfeng_2: { id: 'lingfeng_2', char: 'lingfeng', type: CARD_TYPE.COMMON, name: '幸运金币', tag: TAG.CHAOS, ap: 1, desc: '投硬币。正面：我方攻击+30%；反面：敌方防御-30%。', effect: { coinFlip: true }, quote: '"正面也赢，反面也赢。"' },
    lingfeng_3: { id: 'lingfeng_3', char: 'lingfeng', type: CARD_TYPE.COMMON, name: '资产冻结', tag: TAG.TACTIC, ap: 2, desc: '目标下张牌AP消耗翻倍。', effect: { damage: 2, apCostDouble: true }, quote: '"你的资产已被冻结。"' },

    qiuku_1: { id: 'qiuku_1', char: 'qiuku', type: CARD_TYPE.COMMON, name: '白日梦', tag: TAG.SPIRIT, ap: 2, desc: '令敌方单体[睡眠]（受伤即醒）。', effect: { sleep: true }, quote: '"嘘——做个好梦。"' },
    qiuku_2: { id: 'qiuku_2', char: 'qiuku', type: CARD_TYPE.COMMON, name: '延迟满足', tag: TAG.SPIRIT, ap: 2, desc: '队友回合结束回复8HP。被攻击过则×2。', effect: { delayedHeal: 8, healDoubleIfHit: true }, quote: '"别急，好事多磨。"' },
    qiuku_3: { id: 'qiuku_3', char: 'qiuku', type: CARD_TYPE.COMMON, name: '起床气', tag: TAG.SPIRIT, ap: 2, desc: '全体敌方3点精神伤害(无视防御)。夜间×2。', effect: { aoeDamage: 3, ignoreDefense: true, nightBonus: true }, quote: '"大早上的……别吵！"' },

    juhao_1: { id: 'juhao_1', char: 'juhao', type: CARD_TYPE.COMMON, name: '拟态·Copy', tag: TAG.CHAOS, ap: 1, desc: '复制上一张牌以80%效果打出。', effect: { copyLast: true, efficiency: 0.8 }, quote: '"不好意思，借用一下。"' },
    juhao_2: { id: 'juhao_2', char: 'juhao', type: CARD_TYPE.COMMON, name: '相位转移', tag: TAG.CHAOS, ap: 2, desc: '交换敌方两人位置，打乱行动顺序。', effect: { damage: 2, shuffleOrder: true }, quote: '"你在哪？我在你后面。"' },
    juhao_3: { id: 'juhao_3', char: 'juhao', type: CARD_TYPE.COMMON, name: '省略号', tag: TAG.TACTIC, ap: 2, desc: '无效化敌方下一次[法术]卡。', effect: { nullifyNextMagic: true }, quote: '"……（沉默是最好的否定）"' }
};

// ── Special Cards (2 per character, 1 use each per game) ────────
const SPECIAL_CARDS = {
    hezi_s1: { id: 'hezi_s1', char: 'hezi', type: CARD_TYPE.SPECIAL, name: '天国降临 Deus Vult', tag: TAG.GUARD, desc: '全队[圣战]2回合：攻击吸血+免控。', effect: { teamBuff: 'crusade', duration: 2 }, quote: '"GOD WILLS IT——！！"' },
    hezi_s2: { id: 'hezi_s2', char: 'hezi', type: CARD_TYPE.SPECIAL, name: '无暇的十字架', tag: TAG.GUARD, desc: '复活一名阵亡队友(满血)并赋1回合无敌。', effect: { revive: true, grantInvincible: true }, quote: '"从尘土中起来吧。"' },
    haiyu_s1: { id: 'haiyu_s1', char: 'haiyu', type: CARD_TYPE.SPECIAL, name: '阿瓦隆的叹息', tag: TAG.GUARD, desc: '本回合敌方攻击全转向自己，伤害-80%。', effect: { absorbAllDmg: true, dmgReduce: 0.8 }, quote: '"阿瓦隆不会陷落。"' },
    haiyu_s2: { id: 'haiyu_s2', char: 'haiyu', type: CARD_TYPE.SPECIAL, name: '荣耀冲锋', tag: TAG.SLASH, desc: '造成[护盾值×2]的真实伤害。', effect: { damageFromShield: 2.0 }, quote: '"一骑绝尘！"' },
    chengl_s1: { id: 'chengl_s1', char: 'chengl', type: CARD_TYPE.SPECIAL, name: '关帝圣君的准许', tag: TAG.SLASH, desc: '9次判定(50%命中)，每中3点伤害。命中即获[狂乱]。', effect: { multiRoll: 9, hitChance: 0.5, damagePerHit: 3, buffOnHit: 'frenzy' }, quote: '"关公在上——给我力量！"' },
    chengl_s2: { id: 'chengl_s2', char: 'chengl', type: CARD_TYPE.SPECIAL, name: '周处除三害', tag: TAG.SLASH, desc: '对敌方HP最高者连续攻击3次各4点伤害。', effect: { damage: 4, hits: 3, targetHighest: true }, quote: '"今天，我就是周处。"' },
    ying_s1: { id: 'ying_s1', char: 'ying', type: CARD_TYPE.SPECIAL, name: '秘剑·彼岸花', tag: TAG.SLASH, desc: '单体8点伤害。目标HP<40%直接斩杀。', effect: { damage: 8, executeThreshold: 0.4 }, quote: '"见过彼岸花吗？"' },
    ying_s2: { id: 'ying_s2', char: 'ying', type: CARD_TYPE.SPECIAL, name: '心眼·明镜止水', tag: TAG.SLASH, desc: '暴击率100%持续2回合。', effect: { critRate: 1.0, duration: 2 }, quote: '"心如止水，刀如明镜。"' },
    shounao_s1: { id: 'shounao_s1', char: 'shounao', type: CARD_TYPE.SPECIAL, name: '黑箱操作', tag: TAG.TACTIC, desc: '窥视敌方手牌信息。造成全体3点伤害。', effect: { aoeDamage: 3, revealHands: true }, quote: '"一切尽在掌控。"' },
    shounao_s2: { id: 'shounao_s2', char: 'shounao', type: CARD_TYPE.SPECIAL, name: '谢幕演出', tag: TAG.TACTIC, desc: '敌方HP≤8的角色直接击杀。', effect: { damage: 20, executeHPBelow: 8 }, quote: '"散场了——谢幕。"' },
    dachongzi_s1: { id: 'dachongzi_s1', char: 'dachongzi', type: CARD_TYPE.SPECIAL, name: '向风车冲锋', tag: TAG.MAGIC, desc: '无视防御造成15点伤害，但自身受7点反噬+下回合眩晕。', effect: { damage: 15, ignoreAll: true, selfDmg: 7, selfStun: 1 }, quote: '"疯狂？不，这叫浪漫。"' },
    dachongzi_s2: { id: 'dachongzi_s2', char: 'dachongzi', type: CARD_TYPE.SPECIAL, name: '你与我的Happy Ending', tag: TAG.MAGIC, desc: '链接自身与队友。一方死亡另一方献祭50%HP复活之。', effect: { soulLink: true }, quote: '"同归于尽是最好的结局。"' },
    lingfeng_s1: { id: 'lingfeng_s1', char: 'lingfeng', type: CARD_TYPE.SPECIAL, name: '黄金律：通货膨胀', tag: TAG.TACTIC, desc: '敌方全体AP消耗+1持续2回合。', effect: { enemyAPCostUp: 1, duration: 2 }, quote: '"物价飞涨——我来定。"' },
    lingfeng_s2: { id: 'lingfeng_s2', char: 'lingfeng', type: CARD_TYPE.SPECIAL, name: '最终投资', tag: TAG.TACTIC, desc: '献祭所有临时手牌，每张对随机敌人造成6点伤害。', effect: { sacrificeHand: true, damagePerCard: 6 }, quote: '"全部梭哈——All in."' },
    qiuku_s1: { id: 'qiuku_s1', char: 'qiuku', type: CARD_TYPE.SPECIAL, name: '永恒梦魇', tag: TAG.SPIRIT, desc: '敌方全体[深度睡眠]2回合（暴击才能唤醒）。', effect: { deepSleepAll: true, duration: 2 }, quote: '"全世界都睡着了。"' },
    qiuku_s2: { id: 'qiuku_s2', char: 'qiuku', type: CARD_TYPE.SPECIAL, name: '世界静止之日', tag: TAG.SPIRIT, desc: '跳过敌方下一回合。使用者下回合昏睡。', effect: { skipEnemyTurn: true, selfSleep: 1 }, quote: '"时间…真的停了。"' },
    juhao_s1: { id: 'juhao_s1', char: 'juhao', type: CARD_TYPE.SPECIAL, name: '镜中世界', tag: TAG.CHAOS, desc: '3回合内敌方[治疗]全部转为[毒伤]。', effect: { invertHealing: true, duration: 3 }, quote: '"在镜子另一边，善恶颠倒。"' },
    juhao_s2: { id: 'juhao_s2', char: 'juhao', type: CARD_TYPE.SPECIAL, name: '格式化', tag: TAG.CHAOS, desc: '清除全场所有Buff/Debuff/护盾。', effect: { purgeAll: true }, quote: '"Ctrl+A, Delete."' }
};

// ── Climax Cards ────────────────────────────────────────────────
const CLIMAX_CARDS = {
    ragnarok: { id: 'ragnarok', type: CARD_TYPE.CLIMAX, name: '诸神黄昏 Ragnarök', desc: '全体每回合受5点DOT。所有卡AP减半。', effect: { dotAll: 5, apCostHalf: true }, quote: '"世界树在燃烧。"' },
    objection: { id: 'objection', type: CARD_TYPE.CLIMAX, name: '逆转裁判 Objection!', desc: '劣势方全员回满HP并攻击+100%(1回合)。', effect: { healLosingTeam: true, atkBoost: 1.0 }, quote: '"异议あり！"' },
    cybernuke: { id: 'cybernuke', type: CARD_TYPE.CLIMAX, name: '赛博核爆 Cyber-Nuke', desc: '10秒内疯狂点击充能，造成真实伤害。', effect: { clickCharge: true }, quote: '"核弹需要你的授权。"' },
    nerfbuff: { id: 'nerfbuff', type: CARD_TYPE.CLIMAX, name: '策划的怜悯 Nerf&Buff', desc: '最强者变咸鱼，最弱者变大魔王。', effect: { nerfBest: true, buffWorst: true }, quote: '"平衡性补丁已上线。"' },
    rollback: { id: 'rollback', type: CARD_TYPE.CLIMAX, name: '服务器回档 Rollback', desc: '极稀有。全员HP重置为满血。分数保留。', effect: { rollbackHP: true }, quote: '"检测到异常——回档中…"' }
};

// ── Tombstone Danmaku Messages ──────────────────────────────────
const TOMBSTONE_MESSAGES = [
    "？", "这就躺了？", "6", "笑了", "下次还敢？",
    "我方MVP", "送头大师", "RIP", "别急，还能再送", "tql",
    "真有你的", "经典", "离谱", "你怎么又死了", "太菜了"
];

// ── Helpers ─────────────────────────────────────────────────────
function getCharacterCards(charId) {
    const commons = Object.values(COMMON_CARDS).filter(c => c.char === charId);
    const specials = Object.values(SPECIAL_CARDS).filter(c => c.char === charId);
    return { commons, specials };
}
function getCharacterList() { return Object.values(CHARACTERS); }
function getCardById(id) { return COMMON_CARDS[id] || SPECIAL_CARDS[id] || CLIMAX_CARDS[id] || null; }
function getAllCommonCards() { return Object.values(COMMON_CARDS); }
function getClimaxCardsList() { return Object.values(CLIMAX_CARDS); }
