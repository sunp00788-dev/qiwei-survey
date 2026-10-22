/**
 * 客户端计分：支付力 + 建议通道 + 七维均分
 * 学员结果页只展示七维，通道/支付力仅写入提交 payload（顾问侧）
 */
(function (global) {
  const DIMS = ["身", "意", "命", "心", "运", "神", "道"];

  function avg(nums) {
    const list = (nums || []).map(Number).filter((n) => !Number.isNaN(n));
    if (!list.length) return null;
    return Math.round((list.reduce((a, b) => a + b, 0) / list.length) * 10) / 10;
  }

  function calcQiwei(ratings) {
    const scores = {};
    const avgs = {};
    for (const d of DIMS) {
      const a = avg(ratings[d]);
      avgs[d] = a;
      scores[`${d}均分`] = a;
    }
    const ranked = DIMS
      .filter((d) => avgs[d] != null)
      .sort((a, b) => avgs[a] - avgs[b] || DIMS.indexOf(a) - DIMS.indexOf(b));
    const weakest = ranked.slice(0, 2);
    scores.七维最弱 = weakest;
    scores.七维均分明细 = avgs;
    return scores;
  }

  /**
   * 支付力（锁定）:
   * - 已很难再承担新支出 → 低无
   * - 只想免费 or 机动资金基本没有 → 低无
   * - 投入 in 三千～一万 / 一万～几万 / 大几万也可以看效果 → 高
   * - else 普通
   */
  function calcPayPower(answers) {
    if (answers.再承担能力 === "已很难再承担新支出") return "低无";
    if (answers.可接受投入 === "只想免费" || answers.机动资金 === "基本没有") return "低无";
    const high = ["三千～一万", "一万～几万", "大几万也可以看效果"];
    if (high.includes(answers.可接受投入)) return "高";
    return "普通";
  }

  function hasEnterpriseDebt(types) {
    const list = Array.isArray(types) ? types : [];
    return list.some((t) => t.includes("经营") || t.includes("创业"));
  }

  function hasNeed(answers) {
    if (answers.负债压力 && answers.负债压力 !== "无明显") return true;
    if (answers.最想突破的事 && String(answers.最想突破的事).trim()) return true;
    if (answers.希望获得的帮助 && answers.希望获得的帮助 !== "先自我观察") return true;
    const types = answers.负债类型 || [];
    if (types.length) return true;
    return false;
  }

  /**
   * 通道（锁定）:
   * 低无 → C
   * 全职照顾家庭 → B
   * 老板/股东管理 + 高支付力 + 经营或创业负债 → A
   * else B if need else C
   */
  function calcChannel(answers, payPower) {
    if (payPower === "低无") return "C";
    if (answers.当前身份 === "全职照顾家庭") return "B";

    const boss =
      answers.当前身份 === "企业负责人·老板" ||
      answers.当前身份 === "股东或核心管理";
    if (boss && payPower === "高" && hasEnterpriseDebt(answers.负债类型)) {
      return "A";
    }
    return hasNeed(answers) ? "B" : "C";
  }

  function scoreAll(answers) {
    const qiwei = calcQiwei(answers.七维 || {});
    const 支付力 = calcPayPower(answers);
    const 建议通道 = calcChannel(answers, 支付力);
    return {
      ...qiwei,
      支付力,
      建议通道,
    };
  }

  /** 学员可见文案：绝不提 A/B/C */
  function clientFacingCopy(scores, answers) {
    const weak = scores.七维最弱 || [];
    const weakText = weak.length ? weak.join("、") : "整体较均衡";
    const debtHint = (() => {
      const types = answers.负债类型 || [];
      if (types.some((t) => t.includes("经营") || t.includes("创业"))) {
        return "从你的选择看，压力更可能与经营或创业周转相关，而不是单一消费问题。";
      }
      if (types.some((t) => t.includes("投资"))) {
        return "从你的选择看，压力中带有投资与杠杆相关的成分，适合先理清结构再谈节奏。";
      }
      if (types.length) {
        return "你已标出当前的现实压力来源；建议先稳住最弱的维度，再决定下一步投入。";
      }
      if (answers.负债压力 === "无明显") {
        return "你目前负债压力不明显，更适合用七维快照做自我观察与节奏校准。";
      }
      return "建议结合七维弱项，先把最卡住的一两维理清。";
    })();

    return {
      title: `你的七维快照：最需要关照的是「${weakText}」`,
      body: `${debtHint} 优先从「${weakText}」入手：把觉察落到可执行的一小步，比同时铺开七维更有效。若你希望针对自己的情况做进一步梳理，可联系顾问并告知「已完成问卷」。`,
    };
  }

  global.SurveyScoring = {
    DIMS,
    avg,
    calcQiwei,
    calcPayPower,
    calcChannel,
    scoreAll,
    clientFacingCopy,
  };
})(typeof window !== "undefined" ? window : globalThis);
