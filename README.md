# 七维通关测评

对外主入口推荐：**说明页 → 飞书表单**。

全国、纯免费。访客打开说明页，看清卡点与翻转顺序，再点「开始测评」进入飞书表单。表单地址只写在 `config.js` 的 `FEISHU_FORM_URL`（`INTRO_FORM_URL` 与它是同一处），换正式分享链接时改这一处即可。

**旧七维接粉登记停用，待替换。** `index.html` 多步问卷仍留在仓库，不再作为对外入口。

Pages 说明页：

**https://sunp00788-dev.github.io/qiwei-survey/intro.html**

## 本地预览

```bash
python3 -m http.server 8080
```

打开 http://127.0.0.1:8080/intro.html

## 飞书表单

表单名称：七维通关测评。地址只写在 `config.js` 的 `FEISHU_FORM_URL`，说明页「开始测评」读这一处（`INTRO_FORM_URL` 与它相同）。不要在 `intro.html` 里再写一遍。

```js
FEISHU_FORM_URL: "https://iakdvql5ohk.feishu.cn/share/base/shrcngDmeVui8mT8gSjCVHIk2cb",
```

## 目录

```
intro.html                      # 对外说明页
intro.css
assets/qiwetongguanka.png       # 七维通关卡
assets/suan-tongguan.png        # 算通关
config.js                       # 公开配置（含 FEISHU_FORM_URL）
index.html                      # 旧七维接粉登记（停用待替换）
styles.css
scoring.js
app.js
README.md
```

---

# 附录：旧七维接粉登记（停用待替换）

手机可填的多步问卷：筛选字段 + 七维 28 题评分。  
**学员结果页只展示七维快照**，不展示 A/B/C。  
支付力与建议通道在浏览器内计算后，经 Cloudflare Worker 写入飞书多维表格（密钥只放在 Worker 环境变量，不进仓库）。

此流程已停用，待替换。请对外发放说明页，不要再发 `index.html`。

默认 `config.js` 为 **Mock 模式**：不请求网络，控制台打印完整 payload，并模拟提交成功。

---

## 本地预览

```bash
cd qiwei-survey
python3 -m http.server 8080
```

浏览器打开：http://127.0.0.1:8080/

可选：用示例画像预填（仅开发）  
- `?fill=A-like-boss`  
- `?fill=B-fulltime-mom`  
- `?fill=C-no-pay`

---

## 发布到 GitHub Pages（外网问卷链接）

1. 在 GitHub 新建仓库（例如 `qiwei-survey`），公开或私有均可（私有需 GitHub Pro 等才支持 Pages，一般用公开仓）。
2. 把本目录内容推上去（仓库根目录直接放 `index.html`，或放在 `/docs`）：

```bash
cd qiwei-survey
git init
git add .
git commit -m "feat: 七维接粉问卷静态站"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

3. 打开仓库 → **Settings → Pages**：
   - Source：Deploy from a branch
   - Branch：`main` / 根目录（`/`）或 `docs`
4. 几分钟后访问：

**https://\<你的用户名\>.github.io/\<仓库名\>/**

若站点在子路径，相对路径 `./config.js` 等仍可用。  
自定义域名可在 Pages 里绑定。

---

## 关闭 Mock、写入飞书

浏览器不能直连飞书开放接口（会暴露 App Secret）。流程是：

```
问卷页 (GitHub Pages)  --POST JSON-->  Cloudflare Worker  -->  飞书多维表格新增记录
```

### 1. 飞书侧准备

1. [飞书开放平台](https://open.feishu.cn/) 创建企业自建应用，开通「多维表格」权限（如 `bitable:app`）。
2. 发布应用并在目标企业安装。
3. 新建/打开一张多维表格，按下方「字段映射」建列（字段名建议与下表一致）。
4. 记下：
   - `app_id` / `app_secret`
   - 表格 URL 中的 `app_token`（`/base/` 后面那段）
   - 数据表 `table_id`（表设置里可复制）

### 2. 部署 Worker

```bash
cd worker
npm install
npx wrangler login
npx wrangler secret put FEISHU_APP_ID
npx wrangler secret put FEISHU_APP_SECRET
npx wrangler secret put FEISHU_APP_TOKEN
npx wrangler secret put FEISHU_TABLE_ID
# 可选：限制 CORS
# npx wrangler secret put ALLOWED_ORIGIN
# 值填 https://你的用户名.github.io
npx wrangler deploy
```

记下 Worker 的 `https://….workers.dev` 地址。

### 3. 改公开配置

编辑仓库根目录 `config.js`（无密钥）：

```js
window.SURVEY_CONFIG = {
  FEISHU_PROXY_URL: "https://你的 worker.workers.dev",
  MOCK_MODE: false,
  TITLE: "七维接粉问卷",
  SUBTITLE: "照见你的生命状态，并匹配更合适的沟通方式",
};
```

提交并 push，Pages 自动更新后即可真实写入飞书。

---

## 计分规则（已锁定）

### 支付力

| 条件 | 结果 |
|------|------|
| `再承担能力` = 已很难再承担新支出 | 低无 |
| `可接受投入` = 只想免费，或 `机动资金` = 基本没有 | 低无 |
| `可接受投入` ∈ 三千～一万 / 一万～几万 / 大几万也可以看效果 | 高 |
| 其他 | 普通 |

### 建议通道（仅顾问/飞书可见）

| 顺序 | 条件 | 通道 |
|------|------|------|
| 1 | 支付力 = 低无 | **C** |
| 2 | 当前身份 = 全职照顾家庭 | **B**（默认陪跑/轻量，顾问可人工升 A） |
| 3 | 身份为「企业负责人·老板」或「股东或核心管理」且支付力=高且负债类型含经营或创业 | **A** |
| 4 | 否则有需求信号（有负债压力/类型/突破事项等） | **B** |
| 5 | 否则 | **C** |

七维：每维 4 题 1～10 分取均分，取最低 1～2 维为「七维最弱」。

---

## 飞书字段映射

Worker `worker/src/index.js` 中 `FIELD_MAP` 与下表一致。多选「负债类型」请在飞书建为**多选**；均分可为数字；「原始JSON」建议长文本。

| 写入字段 | 说明 |
|----------|------|
| 姓名昵称、年龄段、常住城市、当前身份 | 基础 |
| 家庭决策角色、家人一起参与 | 全职场景 |
| 负债压力、负债类型、负债量级、负债主因 | 筛选 |
| 机动资金、可接受投入、学习花费、再承担能力 | 支付力输入 |
| 联系方式、最想突破的事、希望获得的帮助 | 回访 |
| 身均分…道均分、七维最弱 | 七维结果 |
| 支付力、建议通道 | 顾问分流（勿对学员展示） |
| 提交时间、原始JSON | 审计 |

---

## 目录说明（旧问卷）

```
index.html          # 旧入口，停用待替换
config.js           # 公开配置（无密钥）
styles.css
scoring.js          # 支付力 / 通道 / 七维
app.js              # 多步表单与提交
```

**切勿**把 `FEISHU_APP_SECRET` 写进前端或提交进 Git。
