/** 公开配置：切勿写入飞书 App Secret 等密钥 */
window.SURVEY_CONFIG = {
  /** Cloudflare Worker（或自建代理）地址；留空则走本地 Mock */
  FEISHU_PROXY_URL: "",
  /** true = 不请求网络，控制台打印 payload 并模拟成功 */
  MOCK_MODE: true,
  /** 问卷标题 */
  TITLE: "七维接粉问卷",
  SUBTITLE: "照见你的生命状态，并匹配更合适的沟通方式",
};
