/**
 * Data Processor Module
 * 专门用于处理和格式化OpenReview数据
 */

import { OpenReviewPaper, OpenReviewReview, OpenReviewComment } from './openreview';

export interface ProcessedReview {
  id: string;
  author: string;
  rating?: number;
  confidence?: number;
  summary?: string;
  strengths?: string;
  weaknesses?: string;
  questions?: string;
  technicalQuality?: {
    soundness?: string;
    presentation?: string;
    contribution?: string;
  };
  rawData: OpenReviewReview;
}

export interface ProcessedComment {
  id: string;
  author: string;
  content: string;
  timestamp?: Date;
  replyTo?: string;
  rawData: OpenReviewComment;
}

export interface ProcessedPaper {
  id: string;
  title: string;
  authors: string[];
  abstract?: string;
  reviews: ProcessedReview[];
  comments: ProcessedComment[];
  statistics: {
    totalReviews: number;
    totalComments: number;
    averageRating?: number;
    ratingDistribution: { [rating: string]: number };
    averageConfidence?: number;
  };
  extractedAt: Date;
}

export class DataProcessor {
  /**
   * 处理原始论文数据
   */
  static processPaper(rawPaper: OpenReviewPaper): ProcessedPaper {
    const processedReviews = rawPaper.reviews.map(review => this.processReview(review));
    const processedComments = rawPaper.comments.map(comment => this.processComment(comment));
    const statistics = this.calculateStatistics(processedReviews);

    return {
      id: rawPaper.id,
      title: rawPaper.title,
      authors: rawPaper.authors,
      abstract: rawPaper.abstract,
      reviews: processedReviews,
      comments: processedComments,
      statistics,
      extractedAt: new Date()
    };
  }

  /**
   * 处理单个评审
   */
  static processReview(rawReview: OpenReviewReview): ProcessedReview {
    const processed: ProcessedReview = {
      id: rawReview.id,
      author: this.anonymizeAuthor(rawReview.author),
      summary: rawReview.summary,
      strengths: rawReview.strengths,
      weaknesses: rawReview.weaknesses,
      questions: rawReview.questions,
      rawData: rawReview
    };

    // 处理评分
    if (rawReview.rating) {
      processed.rating = this.parseRating(rawReview.rating);
    }

    // 处理置信度
    if (rawReview.confidence) {
      processed.confidence = this.parseConfidence(rawReview.confidence);
    }

    // 处理技术质量评估
    processed.technicalQuality = {
      soundness: rawReview.soundness,
      presentation: rawReview.presentation,
      contribution: rawReview.contribution
    };

    return processed;
  }

  /**
   * 处理单个评论
   */
  static processComment(rawComment: OpenReviewComment): ProcessedComment {
    return {
      id: rawComment.id,
      author: this.anonymizeAuthor(rawComment.author),
      content: rawComment.content,
      rawData: rawComment
    };
  }

  /**
   * 计算统计信息
   */
  static calculateStatistics(reviews: ProcessedReview[]) {
    const statistics = {
      totalReviews: reviews.length,
      totalComments: 0, // 这里可以传入comments数量
      ratingDistribution: {} as { [rating: string]: number },
      averageRating: undefined as number | undefined,
      averageConfidence: undefined as number | undefined
    };

    const ratings = reviews
      .map(r => r.rating)
      .filter(r => r !== undefined) as number[];

    const confidences = reviews
      .map(r => r.confidence)
      .filter(c => c !== undefined) as number[];

    // 计算平均评分
    if (ratings.length > 0) {
      statistics.averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    }

    // 计算平均置信度
    if (confidences.length > 0) {
      statistics.averageConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    }

    // 计算评分分布
    ratings.forEach(rating => {
      const ratingStr = rating.toString();
      statistics.ratingDistribution[ratingStr] = (statistics.ratingDistribution[ratingStr] || 0) + 1;
    });

    return statistics;
  }

  /**
   * 解析评分字符串
   */
  static parseRating(ratingStr: string): number | undefined {
    // OpenReview评分通常是 "6: Marginally above the acceptance threshold" 这样的格式
    const match = ratingStr.match(/^(\d+)/);
    return match ? parseInt(match[1]) : undefined;
  }

  /**
   * 解析置信度字符串
   */
  static parseConfidence(confidenceStr: string): number | undefined {
    // 置信度通常是 "3: You are fairly confident in your assessment" 这样的格式
    const match = confidenceStr.match(/^(\d+)/);
    return match ? parseInt(match[1]) : undefined;
  }

  /**
   * 匿名化作者名称
   */
  static anonymizeAuthor(author: string): string {
    // 如果已经是匿名的，直接返回
    if (author.includes('Anonymous') || author.includes('Reviewer') || author.includes('AnonReviewer')) {
      return author;
    }

    // 否则进行简单的匿名化处理
    return `Anonymous Reviewer`;
  }

  /**
   * 生成HTML格式的报告
   */
  static generateHTMLReport(paper: ProcessedPaper): string {
    let html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto;">
      <h1 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
        OpenReview 评论报告
      </h1>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h2 style="color: #2c3e50; margin-top: 0;">论文信息</h2>
        <p><strong>标题:</strong> ${paper.title}</p>
        <p><strong>作者:</strong> ${paper.authors.join(', ')}</p>
        <p><strong>提取时间:</strong> ${paper.extractedAt.toLocaleString()}</p>
        ${paper.abstract ? `<p><strong>摘要:</strong> ${paper.abstract.substring(0, 300)}...</p>` : ''}
      </div>

      <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h2 style="color: #27ae60; margin-top: 0;">统计概览</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          <div>
            <strong>评审数量:</strong> ${paper.statistics.totalReviews}
          </div>
          <div>
            <strong>评论数量:</strong> ${paper.statistics.totalComments}
          </div>
          ${paper.statistics.averageRating ? `
          <div>
            <strong>平均评分:</strong> ${paper.statistics.averageRating.toFixed(2)}
          </div>
          ` : ''}
          ${paper.statistics.averageConfidence ? `
          <div>
            <strong>平均置信度:</strong> ${paper.statistics.averageConfidence.toFixed(2)}
          </div>
          ` : ''}
        </div>
      </div>
    `;

    // 添加评审详情
    if (paper.reviews.length > 0) {
      html += `<h2 style="color: #2c3e50; border-bottom: 1px solid #bdc3c7; padding-bottom: 5px;">评审详情</h2>`;
      
      paper.reviews.forEach((review, index) => {
        html += `
        <div style="border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin-bottom: 15px; background-color: #fff;">
          <h3 style="color: #34495e; margin-top: 0;">评审 ${index + 1}</h3>
          <p><strong>评审者:</strong> ${review.author}</p>
          
          ${review.rating ? `<p><strong>⭐ 评分:</strong> <span style="color: #e74c3c; font-weight: bold;">${review.rating}</span></p>` : ''}
          ${review.confidence ? `<p><strong>🎯 置信度:</strong> ${review.confidence}</p>` : ''}
          
          ${review.summary ? `
          <div style="margin: 10px 0;">
            <strong>📝 摘要:</strong>
            <div style="background-color: #f8f9fa; padding: 10px; border-left: 3px solid #3498db; margin-top: 5px;">
              ${review.summary}
            </div>
          </div>
          ` : ''}
          
          ${review.strengths ? `
          <div style="margin: 10px 0;">
            <strong style="color: #27ae60;">✅ 优点:</strong>
            <div style="background-color: #e8f5e8; padding: 10px; border-left: 3px solid #27ae60; margin-top: 5px;">
              ${review.strengths}
            </div>
          </div>
          ` : ''}
          
          ${review.weaknesses ? `
          <div style="margin: 10px 0;">
            <strong style="color: #e74c3c;">❌ 缺点:</strong>
            <div style="background-color: #fdf2f2; padding: 10px; border-left: 3px solid #e74c3c; margin-top: 5px;">
              ${review.weaknesses}
            </div>
          </div>
          ` : ''}
          
          ${review.questions ? `
          <div style="margin: 10px 0;">
            <strong style="color: #f39c12;">❓ 问题:</strong>
            <div style="background-color: #fef9e7; padding: 10px; border-left: 3px solid #f39c12; margin-top: 5px;">
              ${review.questions}
            </div>
          </div>
          ` : ''}
          
          ${this.generateTechnicalQualityHTML(review.technicalQuality)}
        </div>
        `;
      });
    }

    // 添加评论详情
    if (paper.comments.length > 0) {
      html += `<h2 style="color: #2c3e50; border-bottom: 1px solid #bdc3c7; padding-bottom: 5px;">评论和回复</h2>`;
      
      paper.comments.forEach((comment, index) => {
        html += `
        <div style="border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin-bottom: 10px; background-color: #f8f9fa;">
          <h4 style="color: #34495e; margin-top: 0;">💬 评论 ${index + 1}</h4>
          <p><strong>作者:</strong> ${comment.author}</p>
          <div style="background-color: #fff; padding: 10px; border-left: 3px solid #95a5a6; margin-top: 5px;">
            ${comment.content}
          </div>
        </div>
        `;
      });
    }

    html += `</div>`;
    return html;
  }

  /**
   * 生成技术质量评估的HTML
   */
  private static generateTechnicalQualityHTML(technicalQuality: any): string {
    const qualities = [];
    if (technicalQuality.soundness) qualities.push(`<strong>Soundness:</strong> ${technicalQuality.soundness}`);
    if (technicalQuality.presentation) qualities.push(`<strong>Presentation:</strong> ${technicalQuality.presentation}`);
    if (technicalQuality.contribution) qualities.push(`<strong>Contribution:</strong> ${technicalQuality.contribution}`);

    if (qualities.length === 0) return '';

    return `
    <div style="margin: 10px 0;">
      <strong>📊 技术质量评估:</strong>
      <div style="background-color: #f0f0f0; padding: 10px; border-left: 3px solid #95a5a6; margin-top: 5px;">
        ${qualities.join('<br>')}
      </div>
    </div>
    `;
  }

  /**
   * 生成纯文本格式的报告
   */
  static generateTextReport(paper: ProcessedPaper): string {
    let text = `OpenReview 评论报告\n`;
    text += `${'='.repeat(50)}\n\n`;
    
    text += `论文信息:\n`;
    text += `标题: ${paper.title}\n`;
    text += `作者: ${paper.authors.join(', ')}\n`;
    text += `提取时间: ${paper.extractedAt.toLocaleString()}\n`;
    if (paper.abstract) {
      text += `摘要: ${paper.abstract.substring(0, 300)}...\n`;
    }
    text += `\n`;

    text += `统计概览:\n`;
    text += `评审数量: ${paper.statistics.totalReviews}\n`;
    text += `评论数量: ${paper.statistics.totalComments}\n`;
    if (paper.statistics.averageRating) {
      text += `平均评分: ${paper.statistics.averageRating.toFixed(2)}\n`;
    }
    if (paper.statistics.averageConfidence) {
      text += `平均置信度: ${paper.statistics.averageConfidence.toFixed(2)}\n`;
    }
    text += `\n`;

    // 评审详情
    if (paper.reviews.length > 0) {
      text += `评审详情 (${paper.reviews.length} 条):\n`;
      text += `${'-'.repeat(30)}\n\n`;
      
      paper.reviews.forEach((review, index) => {
        text += `评审 ${index + 1}:\n`;
        text += `评审者: ${review.author}\n`;
        if (review.rating) text += `⭐ 评分: ${review.rating}\n`;
        if (review.confidence) text += `🎯 置信度: ${review.confidence}\n`;
        if (review.summary) text += `📝 摘要: ${review.summary}\n\n`;
        if (review.strengths) text += `✅ 优点: ${review.strengths}\n\n`;
        if (review.weaknesses) text += `❌ 缺点: ${review.weaknesses}\n\n`;
        if (review.questions) text += `❓ 问题: ${review.questions}\n\n`;
        
        // 技术质量
        if (review.technicalQuality?.soundness) text += `📊 Soundness: ${review.technicalQuality.soundness}\n`;
        if (review.technicalQuality?.presentation) text += `📊 Presentation: ${review.technicalQuality.presentation}\n`;
        if (review.technicalQuality?.contribution) text += `📊 Contribution: ${review.technicalQuality.contribution}\n`;
        
        text += `${'-'.repeat(50)}\n\n`;
      });
    }

    // 评论详情
    if (paper.comments.length > 0) {
      text += `评论和回复 (${paper.comments.length} 条):\n`;
      text += `${'-'.repeat(30)}\n\n`;
      
      paper.comments.forEach((comment, index) => {
        text += `💬 评论 ${index + 1}:\n`;
        text += `作者: ${comment.author}\n`;
        text += `内容: ${comment.content}\n`;
        text += `${'-'.repeat(30)}\n\n`;
      });
    }

    return text;
  }
}