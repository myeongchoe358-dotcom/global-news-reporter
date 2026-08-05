/**
 * 全球新闻自动报导流水线 (Pipeline Orchestrator)
 */
class Pipeline {
  constructor(config = {}) {
    this.config = config;
    this.apiKey = config.apiKey || process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;
    
    // 1. 清洗 apiBase
    let rawBase = (config.apiBase || process.env.LLM_API_BASE || 'https://api.deepseek.com/v1').trim();
    const urlMatch = rawBase.match(/https?:\/\/[^\s\]\)]+/);
    if (urlMatch) {
      rawBase = urlMatch[0];
    }

    this.apiBase = rawBase.replace(/\/+$/, '');
    this.model = config.model || process.env.LLM_MODEL || 'deepseek-chat';
  }

  /**
   * 构建结构化区块强约束 Prompt（通用化版：适应任何每日新闻，强制满字数且深度引述）
   */
  buildStoryboardPrompt(newsArticle) {
    const sourceName = newsArticle.source?.name || newsArticle.source || '权威国际媒体';

    return `
你是一名顶级纪录片总导演与国际新闻首席解说员。请根据提供的【新闻原文】，撰写一份专为 5-8 分钟深度视频设计的导演级分镜脚本。

【绝对硬性指令（违反将视作失败生成）】：
1. **字数必须写满，严禁概括抽象！**
   - 旁白是口播核心，正常语速为每分钟 260 字左右。
   - 【分镜1旁白】：**必须不少于 220 字**。
   - 【分镜2旁白】：**必须不少于 350 字**。
   - 【分镜3旁白】：**必须不少于 350 字**。
   - 【分镜4旁白】：**必须不少于 220 字**。

2. **必须穷尽【新闻原文】中的硬核数据与细节**：
   - 必须把新闻原文中出现的所有**人名、地名、机构名、具体数字、百分比、日期、事件前因后果**全部融入旁白中，严禁漏掉任何事实细节！

3. **旁白展开结构指导**：
   - **分镜1**：【权威新闻直接引用（逐字/逐句引述新闻关键原句与首要数据）】 + 【核心悬念与破题】
   - **分镜2**：【新闻中的全套数据与细节展开】 + 【深层背景/政策/历史起因剖析】 + 【对行业/供应链/经济的直接影响】
   - **分镜3**：【核心矛盾与地缘/商业博弈剖析】 + 【多方态度与利益冲突】 + 【运费/成本/连锁反应推演】
   - **分镜4**：【新闻事件核心结论】 + 【远期战略格局展望】

--------------------------------------------------
请严格按照以下格式输出脚本：

【标题】：[结合新闻细节的深度视频标题]

【分镜1 | 黄金破题与新闻事实】（预计时长：50秒 | 旁白要求：至少220字）
🎙️ **旁白口播**：
据 ${sourceName} 报道，[此处写满 220 字以上。必须原汁原味引述新闻核心原句，详细列出新闻中的首要数据与事实，揭示事件发生的直接背景，并提出核心悬念！]
🎥 **画面描述**：[匹配的细分场景描述]
🎬 **即梦/剪映 Prompt**：[中文自然语言 Prompt]
⚙️ **ComfyUI Prompt**：[英文 Tag 组]

【分镜2 | 深度背景与数据全景】（预计时长：80秒 | 旁白要求：至少350字）
🎙️ **旁白口播**：[此处写满 350 字以上！必须把新闻原文中的所有细节数据、具体名单、统计结果一字不漏地展开，并逐一解释这些数据和背景带来的深远影响！]
🎥 **画面描述**：[匹配画面描述]
🎬 **即梦/剪映 Prompt**：[中文 Prompt]
⚙️ **ComfyUI Prompt**：[英文 Tag 组]

【分镜3 | 博弈剖析与连锁剧变】（预计时长：80秒 | 旁白要求：至少350字）
🎙️ **旁白口播**：[此处写满 350 字以上！深入复述新闻中的冲突/竞争/博弈诱因，详细推演各方利益关系，以及由此带来的成本上涨、风险演变或产业链重构等剧烈影响！]
🎥 **画面描述**：[匹配画面描述]
🎬 **即梦/剪映 Prompt**：[中文 Prompt]
⚙️ **ComfyUI Prompt**：[英文 Tag 组]

【分镜4 | 总结展望与未来格局】（预计时长：50秒 | 旁白要求：至少220字）
🎙️ **旁白口播**：[此处写满 220 字以上！全面总结本次新闻事件的决定性意义，并展望未来的影响与趋势走向。]
🎥 **画面描述**：[匹配画面描述]
🎬 **即梦/剪映 Prompt**：[中文 Prompt]
⚙️ **ComfyUI Prompt**：[英文 Tag 组]

--------------------------------------------------
【新闻原文】：
新闻来源: ${sourceName}
新闻标题: ${newsArticle.title || ''}
新闻内容: ${newsArticle.content || newsArticle.description || newsArticle.body || ''}
`;
  }

  getRequestUrl() {
    return `${this.apiBase}/chat/completions`;
  }

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
            { 
              role: 'system', 
              content: '你是一名严肃的国际新闻解说主编。你的原则是：拒绝任何形式的苍白概括，必须提供信息密度极高、字数饱满、逻辑闭环的口播台词。对于字数不够的要求，你必须通过复述新闻中的所有硬核细节、数据并进行严密逻辑推演来补齐。' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.5,
          max_tokens: 4000
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

// 正确的导出语句：
module.exports = Pipeline;
