const Pipeline = require('./pipeline');

async function main() {
  // 1. 初始化 Pipeline 实例
  const pipeline = new Pipeline({
    // 如果设置了 GitHub Secrets / 环境变量会自动读取；也可以在这里显式传入：
    apiKey: process.env.LLM_API_KEY || '你的API_KEY',
    apiBase: process.env.LLM_API_BASE || 'https://api.deepseek.com/v1',
    model: process.env.LLM_MODEL || 'deepseek-chat'
  });

  // 2. 测试用的新闻原文对象
  const newsArticle = {
    title: "美国高级将军警告：保护以色列的海军力量严重不足",
    content: "据《华盛顿邮报》报道，美军驻欧洲最高级别指挥官警告表达，由于中东多点部署分散，海军目前没有足够的力量继续保护以色列免受伊朗弹道导弹的袭击……"
  };

  console.log("正在请求大模型生成脚本，请稍等...\n");

  try {
    // 3. 必须通过 await 调用 generateScript 方法，将 Prompt 发送给大模型
    const resultScript = await pipeline.generateScript(newsArticle);

    console.log("================ 生成的最新分镜脚本 ================\n");
    console.log(resultScript);
  } catch (err) {
    console.error("生成失败，错误信息：", err);
  }
}

main();
