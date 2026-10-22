/**
 * 七维接粉问卷 · 多步表单 + Mock/代理提交
 */
(function () {
  const cfg = window.SURVEY_CONFIG || {};
  const S = window.SurveyScoring;
  const DIMS = S.DIMS;

  const QIWEI_QUESTIONS = {
    身: [
      { key: "身1", label: "精力状态", hint: "近一个月，你白天的精力充沛程度（1 很低～10 很高）" },
      { key: "身2", label: "睡眠质量", hint: "入睡与睡眠恢复是否稳定" },
      { key: "身3", label: "身体舒展", hint: "身体是否常感紧绷、酸痛或沉重" },
      { key: "身4", label: "气血状态", hint: "面色、手脚温凉、整体气血感" },
    ],
    意: [
      { key: "意1", label: "看见困境原因", hint: "能否看见当下困境背后的真实原因" },
      { key: "意2", label: "停止向外求", hint: "遇到问题时，能否减少一味向外求答案" },
      { key: "意3", label: "接纳财富真相", hint: "对财富与匮乏模式的觉察与接纳" },
      { key: "意4", label: "向内调整", hint: "愿意并能够向内调整认知与选择" },
    ],
    命: [
      { key: "命1", label: "看见人生剧本", hint: "是否隐约看见自己重复的人生剧本" },
      { key: "命2", label: "理解处境原因", hint: "能否理解「为何总是落到类似处境」" },
      { key: "命3", label: "认识天赋", hint: "对自己天赋与优势的认识清晰度" },
      { key: "命4", label: "相信命可改写", hint: "相信命运可以被觉知与改写的程度" },
    ],
    心: [
      { key: "心1", label: "安住当下", hint: "能否安住当下，不被过去未来过度拉走" },
      { key: "心2", label: "情绪稳定", hint: "日常情绪的稳定程度" },
      { key: "心3", label: "困境定力", hint: "陷入困境时内心的定力" },
      { key: "心4", label: "情绪波动调节", hint: "情绪波动后能否较快回到中轴" },
    ],
    运: [
      { key: "运1", label: "持续修炼", hint: "是否有持续的自我修炼/练习" },
      { key: "运2", label: "本能行动", hint: "关键时刻能否按内在觉知行动，而非惯性" },
      { key: "运3", label: "启动自愈创造", hint: "能否启动自愈与创造，而不是停在抱怨" },
      { key: "运4", label: "觉知行动", hint: "行动是否带着觉知，而不是盲目忙碌" },
    ],
    神: [
      { key: "神1", label: "精神聚散", hint: "精神是聚拢还是常感涣散" },
      { key: "神2", label: "专注当下", hint: "专注一件事、一个当下的能力" },
      { key: "神3", label: "精神清明", hint: "头脑清明、不混沌的程度" },
      { key: "神4", label: "神凝气聚", hint: "整体「神凝气聚」的体感" },
    ],
    道: [
      { key: "道1", label: "人生方向", hint: "对人生大方向是否相对清晰" },
      { key: "道2", label: "根本方向", hint: "是否感到走在对自己根本正确的方向上" },
      { key: "道3", label: "长期生命眼光", hint: "能否用更长的生命眼光看当下选择" },
      { key: "道4", label: "走在正确方向", hint: "近一个月，你感到自己走在正确方向上的程度" },
    ],
  };

  const state = {
    step: 0,
    answers: {
      姓名昵称: "",
      年龄段: "",
      常住城市: "",
      当前身份: "",
      家庭决策角色: "",
      家人一起参与: "",
      负债压力: "",
      负债类型: [],
      负债量级: "",
      负债主因: "",
      机动资金: "",
      可接受投入: "",
      学习花费: "",
      再承担能力: "",
      联系方式: "",
      最想突破的事: "",
      希望获得的帮助: "",
      七维: { 身: [], 意: [], 命: [], 心: [], 运: [], 神: [], 道: [] },
    },
    scores: null,
    submitting: false,
    submitError: "",
    mockUsed: false,
  };

  const STEPS = [
    { id: "intro", title: "开始之前" },
    { id: "basic", title: "基础信息" },
    { id: "debt", title: "负债画像" },
    { id: "pay", title: "支付与投入" },
    { id: "qiwei1", title: "七维 · 身意命" },
    { id: "qiwei2", title: "七维 · 心运神道" },
    { id: "contact", title: "联系与提交" },
    { id: "result", title: "你的定位" },
  ];

  const el = {
    title: document.getElementById("title"),
    subtitle: document.getElementById("subtitle"),
    progress: document.getElementById("progress"),
    main: document.getElementById("main"),
  };

  if (cfg.TITLE) el.title.textContent = cfg.TITLE;
  if (cfg.SUBTITLE) el.subtitle.textContent = cfg.SUBTITLE;

  function choiceGroup(name, options, { multi = false, value } = {}) {
    const type = multi ? "checkbox" : "radio";
    const selected = multi
      ? new Set(Array.isArray(value) ? value : [])
      : value || "";
    return `<div class="choices" data-name="${esc(name)}" data-multi="${multi ? "1" : "0"}">
      ${options
        .map((opt) => {
          const checked = multi ? selected.has(opt) : selected === opt;
          return `<label class="choice"><input type="${type}" name="${esc(name)}" value="${esc(opt)}" ${checked ? "checked" : ""} /><span>${esc(opt)}</span></label>`;
        })
        .join("")}
    </div>`;
  }

  function field(label, inner, { required = false, hint = "" } = {}) {
    return `<div class="field">
      <label class="main ${required ? "req" : ""}">${esc(label)}${hint ? `<span class="hint">${esc(hint)}</span>` : ""}</label>
      ${inner}
    </div>`;
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function scaleRow(dim, idx, q) {
    const existing = (state.answers.七维[dim] || [])[idx];
    const radios = Array.from({ length: 10 }, (_, i) => {
      const n = i + 1;
      const checked = Number(existing) === n ? "checked" : "";
      return `<label><input type="radio" name="rate-${dim}-${idx}" value="${n}" ${checked} /><span>${n}</span></label>`;
    }).join("");
    return `<div class="rate-row" data-dim="${dim}" data-idx="${idx}">
      <div class="q req">${esc(q.label)}｜${esc(dim)}${idx + 1}</div>
      <div class="qh">${esc(q.hint)}</div>
      <div class="scale">${radios}</div>
    </div>`;
  }

  function dimBlock(dim) {
    const qs = QIWEI_QUESTIONS[dim];
    return `<div class="dim-block"><h3>${esc(dim)}</h3>${qs.map((q, i) => scaleRow(dim, i, q)).join("")}</div>`;
  }

  function collectFromDOM() {
    const root = el.main;
    root.querySelectorAll(".choices").forEach((box) => {
      const name = box.dataset.name;
      const multi = box.dataset.multi === "1";
      if (multi) {
        state.answers[name] = Array.from(box.querySelectorAll("input:checked")).map((i) => i.value);
      } else {
        const checked = box.querySelector("input:checked");
        state.answers[name] = checked ? checked.value : "";
      }
    });
    root.querySelectorAll("input[type='text'][data-key], textarea[data-key]").forEach((inp) => {
      state.answers[inp.dataset.key] = inp.value.trim();
    });
    root.querySelectorAll(".rate-row").forEach((row) => {
      const dim = row.dataset.dim;
      const idx = Number(row.dataset.idx);
      const checked = row.querySelector("input:checked");
      if (!state.answers.七维[dim]) state.answers.七维[dim] = [];
      if (checked) state.answers.七维[dim][idx] = Number(checked.value);
    });
  }

  function validateStep(id) {
    const a = state.answers;
    const showFamily = a.当前身份 === "全职照顾家庭";
    const hasDebt = a.负债压力 && a.负债压力 !== "无明显";

    switch (id) {
      case "intro":
        return true;
      case "basic":
        if (!a.姓名昵称) return "请填写姓名或昵称";
        if (!a.年龄段) return "请选择年龄段";
        if (!a.常住城市) return "请填写常住城市";
        if (!a.当前身份) return "请选择当前身份";
        if (showFamily && !a.家庭决策角色) return "请选择家庭决策角色";
        return true;
      case "debt":
        if (!a.负债压力) return "请选择负债压力";
        if (hasDebt && (!a.负债类型 || !a.负债类型.length)) return "请至少选择一项负债类型";
        if (hasDebt && !a.负债量级) return "请选择负债量级";
        return true;
      case "pay":
        if (!a.机动资金) return "请选择机动资金情况";
        if (!a.可接受投入) return "请选择可接受投入";
        if (!a.学习花费) return "请选择过去一年学习花费";
        if (!a.再承担能力) return "请选择再承担能力";
        return true;
      case "qiwei1":
        for (const d of ["身", "意", "命"]) {
          const arr = a.七维[d] || [];
          if (arr.filter((n) => n >= 1 && n <= 10).length < 4) return `请完成「${d}」全部 4 题评分`;
        }
        return true;
      case "qiwei2":
        for (const d of ["心", "运", "神", "道"]) {
          const arr = a.七维[d] || [];
          if (arr.filter((n) => n >= 1 && n <= 10).length < 4) return `请完成「${d}」全部 4 题评分`;
        }
        return true;
      case "contact":
        if (!a.联系方式) return "请留下联系方式";
        if (!a.最想突破的事) return "请写一句当前最想突破的事";
        return true;
      default:
        return true;
    }
  }

  function renderProgress() {
    const formSteps = STEPS.length - 1; // exclude result from fill progress feel
    el.progress.innerHTML = STEPS.slice(0, -1)
      .map((_, i) => {
        let cls = "";
        if (i < state.step) cls = "done";
        if (i === state.step) cls = "on";
        return `<span class="${cls}"></span>`;
      })
      .join("");
    el.progress.style.display = state.step >= STEPS.length - 1 ? "none" : "flex";
  }

  function nav(opts = {}) {
    const { showPrev = true, nextLabel = "下一步", submit = false } = opts;
    return `<div class="nav">
      ${showPrev && state.step > 0 ? `<button type="button" class="btn-secondary" data-act="prev">上一步</button>` : ""}
      <button type="button" class="btn-primary" data-act="${submit ? "submit" : "next"}" ${state.submitting ? "disabled" : ""}>${esc(state.submitting ? "提交中…" : nextLabel)}</button>
    </div>`;
  }

  function renderIntro() {
    return `
      <h2 class="step-title">开始之前</h2>
      <p class="step-desc">请按近一个月的真实体验填写。约 5～8 分钟。提交后你会看到七维快照与建议关照的维度；顾问会据此匹配更合适的沟通方式（正式梳理 / 试听与微信 / 先自我观察）。本问卷非医学或心理诊断。</p>
      <div class="copy">填写越真实，反馈越有用。涉及负债与投入的题目，是为了匹配服务深度，不会在结果页用刺耳标签评价你。</div>
      ${nav({ showPrev: false, nextLabel: "开始填写" })}
    `;
  }

  function renderBasic() {
    const a = state.answers;
    const showFamily = a.当前身份 === "全职照顾家庭";
    return `
      <h2 class="step-title">基础信息</h2>
      <p class="step-desc">身份很重要：它帮助顾问理解你的决策场景（例如全职照顾家庭也可走陪跑路径）。</p>
      ${field("姓名或昵称", `<input type="text" data-key="姓名昵称" value="${esc(a.姓名昵称)}" placeholder="怎么称呼你" />`, { required: true })}
      ${field("年龄段", choiceGroup("年龄段", ["18–25", "26–35", "36–45", "46–55", "56+"], { value: a.年龄段 }), { required: true })}
      ${field("常住城市", `<input type="text" data-key="常住城市" value="${esc(a.常住城市)}" placeholder="例如：浙江杭州" />`, { required: true })}
      ${field("当前身份", choiceGroup("当前身份", ["企业负责人·老板", "股东或核心管理", "上班族", "投资理财为主", "全职照顾家庭", "自由职业·其他"], { value: a.当前身份 }), { required: true })}
      <div id="family-block" class="${showFamily ? "" : "hidden"}">
        ${field("家庭决策角色", choiceGroup("家庭决策角色", ["主要决策人", "与伴侣共同决定", "更能影响伴侣来参与", "暂不主导"], { value: a.家庭决策角色 }), { required: true, hint: "仅全职照顾家庭时填写" })}
        ${field("是否希望家人一起参与", choiceGroup("家人一起参与", ["是", "否", "还不确定"], { value: a.家人一起参与 || "还不确定" }))}
      </div>
      ${nav()}
    `;
  }

  function renderDebt() {
    const a = state.answers;
    const hasDebt = a.负债压力 && a.负债压力 !== "无明显";
    return `
      <h2 class="step-title">负债画像</h2>
      <p class="step-desc">负债量级是基础参考，会与身份、支付力综合看；量级高不等于没有购买力。</p>
      ${field("目前负债压力", choiceGroup("负债压力", ["无明显", "有一些", "比较大", "很大"], { value: a.负债压力 }), { required: true })}
      <div id="debt-detail" class="${hasDebt ? "" : "hidden"}">
        ${field("负债类型（可多选）", choiceGroup("负债类型", ["消费贷信用卡等", "经营负债", "创业负债", "投资负债", "房车按揭", "担保民间", "其他"], { multi: true, value: a.负债类型 }), { required: true })}
        ${field("合计负债量级", choiceGroup("负债量级", ["5万内", "5–20万", "20–50万", "50–100万", "100–300万", "300万+", "不便说"], { value: a.负债量级 }), { required: true })}
        ${field("主要形成原因", choiceGroup("负债主因", ["经营周转", "创业未达预期", "投资亏损", "消费错配", "担保人情", "变故", "叠加", "其他"], { value: a.负债主因 }))}
      </div>
      ${nav()}
    `;
  }

  function renderPay() {
    const a = state.answers;
    return `
      <h2 class="step-title">支付与投入</h2>
      <p class="step-desc">下面几题问的是：在现有负债之外，你是否仍有能力为一次真正有用的学习/梳理做投入（与负债总额不是同一回事）。</p>
      ${field("扣除刚性还款后，每月可调度资金", choiceGroup("机动资金", ["基本没有", "少量应急", "还能挤出学习预算", "仍有较充足机动", "不便说"], { value: a.机动资金 }), { required: true })}
      ${field("若路径匹配，更能接受的投入", choiceGroup("可接受投入", ["只想免费", "几百", "一两千", "三千～一万", "一万～几万", "大几万也可以看效果"], { value: a.可接受投入 }), { required: true })}
      ${field("过去一年为学习/咨询大约花费", choiceGroup("学习花费", ["0", "500内", "500–3000", "3000–1万", "1万+"], { value: a.学习花费 }), { required: true })}
      ${field("当前是否已难再承担新支出", choiceGroup("再承担能力", ["否", "有压力但还能周转", "已很难再承担新支出"], { value: a.再承担能力 }), { required: true })}
      ${nav()}
    `;
  }

  function renderQiwei(dims) {
    return `
      <h2 class="step-title">七维自评（1～10 分）</h2>
      <p class="step-desc">请按近一个月真实体验打分。1 = 很低/几乎没有，10 = 很高/非常稳定。</p>
      ${dims.map(dimBlock).join("")}
      ${nav()}
    `;
  }

  function renderContact() {
    const a = state.answers;
    return `
      <h2 class="step-title">联系与提交</h2>
      <p class="step-desc">留下联系方式后提交。你会先看到七维定位；顾问后台会同步完整答卷。</p>
      ${field("联系方式（手机或微信号）", `<input type="text" data-key="联系方式" value="${esc(a.联系方式)}" placeholder="方便回访的联系方式" />`, { required: true })}
      ${field("当前最想突破的事", `<textarea data-key="最想突破的事" placeholder="一句话即可">${esc(a.最想突破的事)}</textarea>`, { required: true })}
      ${field("希望获得的帮助", choiceGroup("希望获得的帮助", ["预约正式梳理（会议室）", "先了解陪跑/试听", "微信里先点清问题", "先自我观察", "还不确定"], { value: a.希望获得的帮助 }))}
      ${state.submitError ? `<div class="error-banner">${esc(state.submitError)}</div>` : ""}
      ${nav({ nextLabel: "提交并查看定位", submit: true })}
    `;
  }

  function advisorSummaryText() {
    const a = state.answers;
    const s = state.scores || {};
    const debtTypes = Array.isArray(a.负债类型) ? a.负债类型.join("、") : a.负债类型 || "—";
    const weak = Array.isArray(s.七维最弱) ? s.七维最弱.join("、") : s.七维最弱 || "—";
    return [
      "【七维接粉·顾问摘要】",
      "建议通道：" + (s.建议通道 || "—"),
      "支付力：" + (s.支付力 || "—"),
      "姓名：" + (a.姓名昵称 || "—"),
      "联系方式：" + (a.联系方式 || "—"),
      "身份：" + (a.当前身份 || "—") + (a.家庭决策角色 ? " / " + a.家庭决策角色 : ""),
      "城市/年龄：" + (a.常住城市 || "—") + " / " + (a.年龄段 || "—"),
      "负债：" + (a.负债压力 || "—") + " | " + debtTypes + " | " + (a.负债量级 || "—"),
      "投入意向：" + (a.可接受投入 || "—") + " | 机动资金：" + (a.机动资金 || "—"),
      "七维最弱：" + weak,
      "均分：身" + (s.身均分 ?? "—") + " 意" + (s.意均分 ?? "—") + " 命" + (s.命均分 ?? "—") + " 心" + (s.心均分 ?? "—") + " 运" + (s.运均分 ?? "—") + " 神" + (s.神均分 ?? "—") + " 道" + (s.道均分 ?? "—"),
      "最想突破：" + (a.最想突破的事 || "—"),
    ].join("\n");
  }

  function renderResult() {
    const scores = state.scores;
    const copy = S.clientFacingCopy(scores, state.answers);
    const avgs = scores.七维均分明细 || {};
    const bars = DIMS.map((d) => {
      const v = avgs[d] == null ? 0 : avgs[d];
      const pct = Math.max(0, Math.min(100, (v / 10) * 100));
      return `<div class="score-item"><strong>${esc(d)}</strong><div class="bar"><i style="width:${pct}%"></i></div><span>${v == null ? "—" : v}</span></div>`;
    }).join("");
    const tags = (scores.七维最弱 || []).map((d) => `<span class="weak-tag">${esc(d)}</span>`).join("");
    return `
      <div class="results">
        <h2 class="step-title">${esc(copy.title)}</h2>
        <p class="step-desc">以下仅展示七维快照，便于你自我对照。</p>
        <div class="score-list">${bars}</div>
        <p><strong>建议优先关照：</strong>${tags || "—"}</p>
        <div class="copy">${esc(copy.body)}</div>
        <div class="mock-badge" style="color:var(--accent);background:var(--accent-soft)">已完成自评。如需进一步沟通，可将下方摘要发给予心小师姐。</div>
        <div class="nav" style="margin-top:16px">
          <button type="button" class="btn primary" data-act="copy-advisor">复制摘要发给顾问</button>
        </div>
        <p class="step-desc" id="copy-hint" style="margin-top:8px"></p>
      </div>
    `;
  }

  function render() {
    renderProgress();
    const id = STEPS[state.step].id;
    let html = "";
    switch (id) {
      case "intro":
        html = renderIntro();
        break;
      case "basic":
        html = renderBasic();
        break;
      case "debt":
        html = renderDebt();
        break;
      case "pay":
        html = renderPay();
        break;
      case "qiwei1":
        html = renderQiwei(["身", "意", "命"]);
        break;
      case "qiwei2":
        html = renderQiwei(["心", "运", "神", "道"]);
        break;
      case "contact":
        html = renderContact();
        break;
      case "result":
        html = renderResult();
        break;
    }
    el.main.innerHTML = html;
    bind();
  }

  function bind() {
    el.main.querySelectorAll("[data-act]").forEach((btn) => {
      btn.addEventListener("click", onNav);
    });
    const copyBtn = el.main.querySelector('[data-act="copy-advisor"]');
    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        const textOut = advisorSummaryText();
        const hint = document.getElementById("copy-hint");
        try {
          await navigator.clipboard.writeText(textOut);
          if (hint) hint.textContent = "已复制。可直接粘贴到微信发给顾问。";
        } catch (err) {
          window.prompt("复制下面全部内容发给顾问：", textOut);
          if (hint) hint.textContent = "已弹出文本，请手动全选复制。";
        }
      });
    }
    // live toggle family / debt detail
    el.main.querySelectorAll('input[name="当前身份"]').forEach((inp) => {
      inp.addEventListener("change", () => {
        collectFromDOM();
        const block = document.getElementById("family-block");
        if (block) block.classList.toggle("hidden", state.answers.当前身份 !== "全职照顾家庭");
      });
    });
    el.main.querySelectorAll('input[name="负债压力"]').forEach((inp) => {
      inp.addEventListener("change", () => {
        collectFromDOM();
        const block = document.getElementById("debt-detail");
        if (block) block.classList.toggle("hidden", !state.answers.负债压力 || state.answers.负债压力 === "无明显");
      });
    });
  }

  function onNav(e) {
    const act = e.currentTarget.dataset.act;
    collectFromDOM();
    if (act === "prev") {
      state.step = Math.max(0, state.step - 1);
      state.submitError = "";
      render();
      window.scrollTo(0, 0);
      return;
    }
    if (act === "next") {
      const id = STEPS[state.step].id;
      const ok = validateStep(id);
      if (ok !== true) {
        alert(ok);
        return;
      }
      state.step += 1;
      render();
      window.scrollTo(0, 0);
      return;
    }
    if (act === "submit") {
      const ok = validateStep("contact");
      if (ok !== true) {
        alert(ok);
        return;
      }
      doSubmit();
    }
  }

  function buildPayload() {
    const scores = S.scoreAll(state.answers);
    state.scores = scores;
    return {
      ...state.answers,
      scores: {
        身均分: scores.身均分,
        意均分: scores.意均分,
        命均分: scores.命均分,
        心均分: scores.心均分,
        运均分: scores.运均分,
        神均分: scores.神均分,
        道均分: scores.道均分,
        七维最弱: scores.七维最弱,
        支付力: scores.支付力,
        建议通道: scores.建议通道,
      },
      提交时间: new Date().toISOString(),
    };
  }

  async function doSubmit() {
    if (state.submitting) return;
    state.submitting = true;
    state.submitError = "";
    render();

    const payload = buildPayload();
    const useMock = cfg.MOCK_MODE || !cfg.FEISHU_PROXY_URL;

    try {
      if (useMock) {
        console.info("[七维问卷 Mock] payload =", payload);
        console.info("[七维问卷 Mock] 支付力 =", payload.scores.支付力, "建议通道 =", payload.scores.建议通道);
        state.mockUsed = true;
        await new Promise((r) => setTimeout(r, 400));
      } else {
        const res = await fetch(cfg.FEISHU_PROXY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.ok === false) {
          throw new Error(data.error || `提交失败 HTTP ${res.status}`);
        }
        state.mockUsed = false;
      }
      state.step = STEPS.length - 1;
    } catch (err) {
      state.submitError = String(err.message || err);
      console.error(err);
    } finally {
      state.submitting = false;
      render();
      window.scrollTo(0, 0);
    }
  }

  // Dev helper: ?fill=A-like-boss | B-fulltime-mom | C-no-pay
  async function maybeFillFixture() {
    const params = new URLSearchParams(location.search);
    const id = params.get("fill");
    if (!id) return;
    try {
      const res = await fetch("./fixtures/examples.json");
      const data = await res.json();
      const ex = (data.examples || []).find((e) => e.id === id);
      if (!ex) return;
      Object.assign(state.answers, ex.payload);
      console.info("[fixture]", id, "expected", ex.expected_通道, ex.expected_支付力);
    } catch (e) {
      console.warn("fixture load failed", e);
    }
  }

  maybeFillFixture().finally(render);
})();
