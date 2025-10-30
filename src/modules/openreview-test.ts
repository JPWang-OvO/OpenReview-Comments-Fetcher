/**
 * OpenReview API Module Test
 * 用于测试OpenReview API模块功能
 */

import { OpenReviewClient } from './openreview';

export async function testOpenReviewAPI() {
  console.log('OpenReview API 测试开始');
  console.log('='.repeat(40));

  const forumId = 'jCPak79Kev'; // 测试用的论文ID
  const client = new OpenReviewClient();

  try {
    console.log('正在查询论文: AnalogGenie - A Generative Engine for Automatic Discovery of Analog Circuit Topologies');
    console.log('论文链接: https://openreview.net/forum?id=jCPak79Kev');
    console.log(`正在查询 forum ID: ${forumId}`);

    // 获取完整的论文信息
    const paper = await client.getPaperWithReviews(forumId);
    
    console.log('✓ 成功获取论文信息!');
    console.log(`\n=== 主论文信息 ===`);
    console.log(`ID: ${paper.id}`);
    console.log(`标题: ${paper.title}`);
    console.log(`作者: ${paper.authors.join(', ')}`);
    
    if (paper.abstract) {
      console.log(`摘要: ${paper.abstract.substring(0, 300)}...`);
    }

    console.log(`\n=== 评审详情 (${paper.reviews.length} 条评审) ===`);
    paper.reviews.forEach((review, index) => {
      console.log(`\n🔍 评审 ${index + 1}`);
      console.log(`评审者: ${review.author}`);
      
      if (review.rating) console.log(`⭐ 评分: ${review.rating}`);
      if (review.confidence) console.log(`🎯 置信度: ${review.confidence}`);
      if (review.summary) console.log(`📝 摘要: ${review.summary}`);
      if (review.strengths) console.log(`✅ 优点: ${review.strengths}`);
      if (review.weaknesses) console.log(`❌ 缺点: ${review.weaknesses}`);
      if (review.questions) console.log(`❓ 问题: ${review.questions}`);
      
      // 其他字段
      const otherFields = ['soundness', 'presentation', 'contribution'];
      otherFields.forEach(field => {
        if (review[field]) {
          console.log(`📊 ${field.charAt(0).toUpperCase() + field.slice(1)}: ${review[field]}`);
        }
      });
      
      console.log('='.repeat(80));
    });

    if (paper.comments.length > 0) {
      console.log(`\n=== 评论和回复 (${paper.comments.length} 条) ===`);
      paper.comments.forEach((comment, index) => {
        console.log(`\n💬 评论 ${index + 1}`);
        console.log(`作者: ${comment.author}`);
        console.log(`内容: ${comment.content}`);
        console.log('-'.repeat(60));
      });
    }

    // 测试格式化功能
    console.log('\n=== 格式化文本测试 ===');
    const formattedText = OpenReviewClient.formatReviewsAsText(paper);
    console.log('格式化文本长度:', formattedText.length);
    console.log('格式化文本预览:', formattedText.substring(0, 500) + '...');

    return paper;

  } catch (error) {
    console.error('测试失败:', error);
    throw error;
  }
}

// 测试URL解析功能
export function testUrlParsing() {
  console.log('\n=== URL解析测试 ===');
  
  const testUrls = [
    'https://openreview.net/forum?id=jCPak79Kev',
    'https://openreview.net/forum?id=jCPak79Kev&noteId=abc123',
    'https://openreview.net/pdf?id=jCPak79Kev',
    'invalid-url'
  ];

  testUrls.forEach(url => {
    const forumId = OpenReviewClient.extractForumId(url);
    console.log(`URL: ${url} -> Forum ID: ${forumId}`);
  });
}