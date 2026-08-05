/**
 * 全球新闻自动报导流水线 (Pipeline Orchestrator)
 */

class Pipeline {
  constructor(config = {}) {
    this.config = config;
  }

/**
   * 生成优化后的闭环分镜脚本（兼容即梦/剪映/ComfyUI提示词）
   * @param {Object} newsArticle 新闻源数据
   * @returns {String} 重构后的完整提示词
   */
  buildStoryboardPrompt(newsArticle) {
    return `
你是一名专业的短视频新闻主编与 AI 视频导演。请根据以下新闻原文，撰写包含【完整闭环旁白】与【适配即梦/剪映/ComfyUI的视频Prompt】的短视频脚本。

【核心原则与规则】：
1. **旁白完全闭环**：每个分镜的旁白必须是结构完整的句子（包含主语、谓语、核心事实与结果），严禁仅留悬念问句或未完结表述。
2. **多工具 AI 视频提示词**：
   - 🎬 **即梦/剪映 Prompt（中文自然语言）**：注重主旨画面、动态变化、镜头调度（如：近景推镜头、特写、慢动作）。
   - ⚙️ **ComfyUI Prompt（英文 Tag/Prompt）**：包含 Subject, Environment, Lighting, Camera movement, Quality tags (e.g. cinematic, 8k, photorealistic, news footage style)。

【四段式分镜结构】：
- **【分镜1 | 黄金开场与破题】**
  - 🎥 画面描述（中文场景概述）
  - 🎬 即梦/剪映 Prompt（中文提示词）：
  - ⚙️ ComfyUI Prompt（英文提示词）：
  - 🎙️ 闭环旁白（抛出吸引力开场 + 1-3 句话完整交代新闻核心事件：主体、时间、地点、起因与后果）

- **【分镜2 | 深度背景】**
  - 🎥 画面描述
  - 🎬 即梦/剪映 Prompt：
  - ⚙️ ComfyUI Prompt：
  - 🎙️ 闭环旁白（完整说明导致该事件发生的历史/政策原因或深层起因）

- **【分镜3 | 连锁反应】**
  - 🎥 画面描述
  - 🎬 即梦/剪映 Prompt：
  - ⚙️ ComfyUI Prompt：
  - 🎙️ 闭环旁白（完整交代各方的具体表态以及带来的连锁反应/国际影响）

- **【分镜4 | 总结展望】**
  - 🎥 画面描述
  - 🎬 即梦/剪映 Prompt：
  - ⚙️ ComfyUI Prompt：
  - 🎙️ 闭环旁白（完整总结事件影响，并给出明确的后续走向展望，完成收尾）

【新闻原文】：
标题: ${newsArticle.title || ''}
内容: ${newsArticle.content || newsArticle.description || ''}
`;
  }

  /**
   * 格式化输出，确保无字数截断
   */
  formatOutput(rawScript) {
    if (!rawScript) return '';
    // 移除任何可能的 .substring() / .slice() 截断，直接返回原始完整 AI 生成文本
    return rawScript.trim();
  }
}

module.exports = Pipeline;
