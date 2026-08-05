/**
 * 全球新闻自动报导流水线 (Pipeline Orchestrator)
 */

class Pipeline {
  constructor(config = {}) {
    this.config = config;
    // 配置免费 API Base 和 API Key
    // 支持 DeepSeek 免费/低成本接口或 SiliconFlow (硅基流动) 的免费模型
    this.apiKey = config.apiKey || process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;
    this.apiBase = config.apiBase || process.env.LLM_API_BASE || 'https://api.deepseek.com/v1'; 
    this.model = config.model || process.env.LLM_MODEL || 'deepseek-chat';
  }

  /**
   * 生成无断句、全闭环、含多工具画面提示词的分镜 Prompt
   */
  buildStoryboardPrompt(newsArticle) {
    return `
你是一名专业的短视频新闻主编与 AI 视频导演。请根据以下新闻原文，撰写包含【完整闭环旁白】与【适配即梦/剪映/ComfyUI的视频Prompt】的 5 分钟短视频脚本。

【核心原则（必须严格遵守）】：
1. **彻底消除断句与模板套话**：
   - 严禁使用“巨大棋局…”“我们接着往下看…”“顺着这个线索…”等没有实际事实内容的悬念套话。
   - 严禁出现“。。”（双句号）等标点拼接错误。
2. **所有分镜旁白必须完全闭环并输出完整新闻事实**：
   - 【分镜1 | 黄金破题与核心事实】：抛出吸引力开场后，**必须用 1-2 句话完整交代新闻核心事件**（谁在何时何地做了什么，造成了什么直接结果），确保开场 30 秒即掌握完整全貌。
   - 【分镜2 | 深度背景】：完整说明导致该事件发生的历史/政策/军事起因，不能留半句话。
   - 【分镜3 | 连锁反应】：完整交代各方的具体表态以及带来的连锁反应与国际影响。
   - 【分镜4 | 总结展望】：完整总结事件影响，并给出明确的后续走向展望，闭环收尾。

3. **画面提示词（Prompt）格式要求**：
   - 🎥 **画面描述**：中文场景概述。
   - 🎬 **即梦/剪映 Prompt**：中文自然语言，包含场景、动作与镜头调度。
   - ⚙️ **ComfyUI Prompt**：英文 Tag 组（Subject, Environment, Lighting, Camera movement, Quality tags）。

【新闻原文】：
标题: ${newsArticle.title || ''}
内容: ${newsArticle.content || newsArticle.description || newsArticle.body || ''}
`;
  }

  /**
   * 调用免费 API 生成脚本
   */
  async generateScript(newsArticle) {
    const prompt = this.buildStoryboardPrompt(newsArticle);

    try {
      const response = await fetch(`${this.apiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2500
        })
      });

      const data = await response.json();
      const rawScript = data.choices?.[0]?.message?.content || '';
      return this.formatOutput(rawScript);
    } catch (error) {
      console.error('免费大模型 API 调用失败:', error);
      throw error;
    }
  }

  /**
   * 格式化输出，确保无字数截断
   */
  formatOutput(rawScript) {
    if (!rawScript) return '';
    return rawScript.trim();
  }
}

module.exports = Pipeline;
