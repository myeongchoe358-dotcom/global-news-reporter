const Pipeline = require('./pipeline');

async function main() {
  // 1. 初始化 Pipeline 实例
  // 配置 DeepSeek 官方 API Base 与模型名称 deepseek-chat (对应 DeepSeek-V3)
  const pipeline = new Pipeline({
    apiKey: process.env.LLM_API_KEY,
    apiBase: process.env.LLM_API_BASE || 'https://api.deepseek.com/v1', 
    model: process.env.LLM_MODEL || 'deepseek-chat'
  });

  // 2. 测试新闻数据
  const newsArticle = {
    title: "美国高级将军警告：保护以色列的海军力量严重不足",
    content: "据《华盛顿邮报》报道，美军驻欧洲最高级别指挥官发出紧急警告，由于中东多点部署分散，海军目前缺乏足够的力量保护以色列免受弹道导弹袭击……"
  };

  console.log("🚀 正在请求 DeepSeek-V3 实时生成闭环分镜脚本...\n");

  try {
    // 3. 异步调用 generateScript 生成 AI 脚本
    const resultScript = await pipeline.generateScript(newsArticle);

    console.log("================ DeepSeek 生成的闭环分镜脚本 ================\n");
    console.log(resultScript);
  } catch (err) {
    console.error("❌ 生成失败，请检查 API Key 与账户余额/额度：", err);
  }
}

main();
