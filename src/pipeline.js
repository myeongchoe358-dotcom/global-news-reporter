/**
 * 全球新闻自动报导流水线 (Pipeline Orchestrator)
 */
class Pipeline {
  constructor(config = {}) {
    this.config = config;
    this.apiKey = config.apiKey || process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;
    
    // 1. 清洗 apiBase，防止末尾斜杠与 Markdown 链接格式
    let rawBase = (config.apiBase || process.env.LLM_API_BASE || 'https://api.deepseek.com/v1').trim();
    const urlMatch = rawBase.match(/https?:\/\/[^\s\]\)]+/);
    if (urlMatch) {
      rawBase = urlMatch[0];
    }

    this.apiBase = rawBase.replace(/\/+$/, '');
    this.model = config.model || process.env.LLM_MODEL || 'deepseek-chat';
  }

  /**
   * 构建深度视频脚本 Prompt（含新闻出处引用、极丰满旁白与时长匹配提示词）
   */
  buildStoryboardPrompt(newsArticle) {
    const sourceName = newsArticle.source?.name || newsArticle.source || '权威国际媒体';

    return `
你是一名资深国际新闻主编与 AI 视频导演。请根据以下新闻原文，撰写一份专为 5-8 分钟深度解说视频设计的分镜脚本。

【核心撰写标准（必须严格执行）】：

1. **黄金破题与新闻出处强制引用**：
   - 在【分镜1】中，必须明确引用新闻出处（如：“据 ${sourceName} 最新报道…”），并用 3-4 句极其精炼且信息量爆炸的话，交代完整核心事件（时间、地点、核心人物/主体、事件经过及直接结果）。

2. **旁白台词极度丰满、拒绝苍白概括**：
   - 旁白是视频的核心口播内容，必须**字数饱满、逻辑严密、细节丰富**。
   - 深入剖析事件产生的**历史/政策背景、各方势力利益博弈、核心矛盾焦点以及未来的连锁反应与地缘影响**。
   - 严禁使用“巨大棋局…”“我们接着往下看…”“顺着这个线索…”等没有实际事实内容的套话。

3. **画面 Prompt 必须与旁白时长/节奏精确匹配**：
   - 按照正常口播速度（每分钟 250-300 字），每个分镜的画面 Prompt 需要根据旁白时长拆分为**多个细节镜头画面**（比如每个镜头 4-6 秒），确保视频画面的丰富度与旁白节奏完全一致。

--------------------------------------------------
请严格按照以下格式输出脚本：

【标题】：[吸引人的深度视频标题]

【分镜1 | 黄金破题与新闻事实】（预计时长：40-60秒，旁白约 200-250 字）
🎙️ **旁白口播**：[据 ${sourceName} 报道...明确交代新闻出处，提炼核心事实，抛出核心悬念与问题]
🎥 **画面描述**：[中文场景概括，包含 3-4 个细分镜头动作切换]
🎬 **即梦/剪映 Prompt**：[中文自然语言，描述镜头调度与连续画面演变，匹配 40-60 秒节奏]
⚙️ **ComfyUI Prompt**：[英文 Tag 组：Subject, Environment, Lighting, Camera movement, Quality tags]

【分镜2 | 深度背景与历史起因】（预计时长：60-90秒，旁白约 300-400 字）
🎙️ **旁白口播**：[详细展开该事件发生的深层背景、历史渊源或政策导火索，逻辑严密，事实详尽]
🎥 **画面描述**：[匹配背景叙事的多镜头画面]
🎬 **即梦/剪映 Prompt**：[中文 Prompt，匹配时间线推进与场景切换]
⚙️ **ComfyUI Prompt**：[英文 Tag 组]

【分镜3 | 多方博弈与剖析分析】（预计时长：60-90秒，旁白约 300-400 字）
🎙️ **旁白口播**：[剖析各方核心利益、态度表态、产生的连锁反应及国际影响]
🎥 **画面描述**：[匹配多方对抗/协作的动态画面]
🎬 **即梦/剪映 Prompt**：[中文 Prompt]
⚙️ **ComfyUI Prompt**：[英文 Tag 组]

【分镜4 | 总结展望与未来影响】（预计时长：40-60秒，旁白约 200-250 字）
🎙️ **旁白口播**：[总结事件决定性意义，给出明确的走向预测与影响评估，闭环收尾]
🎥 **画面描述**：[总结性的远景/象征性画面]
🎬 **即梦/剪映 Prompt**：[中文 Prompt]
⚙️ **ComfyUI Prompt**：[英文 Tag 组]

--------------------------------------------------
【新闻原文】：
新闻来源: ${sourceName}
新闻标题: ${newsArticle.title || ''}
新闻内容: ${newsArticle.content || newsArticle.description || newsArticle.body || ''}
`;
  }

  /**
   * 安全拼接 API URL
   */
  getRequestUrl() {
    return `${this.apiBase}/chat/completions`;
  }

  /**
   * 调用大模型 API 生成脚本
   */
  async generateScript(newsArticle) {
    const prompt = this.buildStoryboardPrompt(newsArticle);
    const requestUrl = this.getRequestUrl();

    try {
      const response = await fetch(requestUrl, {
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
          max_tokens: 4000 // 调高 max_tokens 以支持更丰满的口播台词生成
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorDetails = data.error?.message || data.message || JSON.stringify(data);
        throw new Error(`[API Error ${response.status}]: ${errorDetails}`);
      }

      const rawScript = data.choices?.[0]?.message?.content || '';
      if (!rawScript) {
        throw new Error('API 返回的数据中未获取到有效文本内容');
      }

      return this.formatOutput(rawScript);
    } catch (error) {
      console.error('大模型 API 调用失败:', error.message);
      throw error;
    }
  }

  formatOutput(rawScript) {
    if (!rawScript) return '';
    return rawScript.trim();
  }
}

module.exports = Pipeline;
