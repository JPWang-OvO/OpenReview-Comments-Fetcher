import { OpenReviewClient } from "./openreview";
import { DataProcessor } from "./data-processor";
import {
  ErrorHandler,
  OpenReviewError,
  ValidationRules,
} from "./error-handler";
import { OpenReviewSettingsManager } from "./openreview-settings";
import { getString } from "../utils/locale";
import type { FluentMessageId } from "../../typings/i10n";
import {
  findOpenReviewUrl,
  saveReviewsAsNote,
  saveReviewsAsAttachment,
} from "./openreview-utils";

/**
 * 单个条目的处理结果
 */
export interface SingleItemResult {
  /** 条目ID */
  itemId: number;
  /** 条目标题 */
  title: string;
  /** 是否成功 */
  success: boolean;
  /** 错误信息（如果失败） */
  error?: string;
  /** 处理的评审数量 */
  reviewCount?: number;
  /** 处理的评论数量 */
  commentCount?: number;
  /** 保存的内容类型 */
  savedAs?: "html-note" | "markdown-attachment";
  /** 对话树统计信息 */
  treeStats?: {
    totalNotes: number;
  };
}

/**
 * 批量处理的整体结果
 */
export interface BatchResult {
  /** 总条目数 */
  totalItems: number;
  /** 成功处理的条目数 */
  successCount: number;
  /** 失败的条目数 */
  failureCount: number;
  /** 每个条目的详细结果 */
  results: SingleItemResult[];
  /** 开始时间 */
  startTime: Date;
  /** 结束时间 */
  endTime: Date;
  /** 总耗时（ms） */
  duration: number;
}

/**
 * 批量进度信息
 */
export interface BatchProgress {
  /** 当前处理的条目索引（从0开始） */
  currentIndex: number;
  /** 总条目数 */
  totalItems: number;
  /** 当前条目的标题 */
  currentTitle: string;
  /** 当前条目的处理阶段（本地化文本） */
  currentStage: string;
  /** 当前条目的进度百分比（0-100） */
  currentItemProgress: number;
  /** 整体进度百分比（0-100） */
  overallProgress: number;
  /** 已成功处理的条目数 */
  successCount: number;
  /** 已失败的条目数 */
  failureCount: number;
}

/**
 * 处理阶段枚举
 */
export enum ProcessingStage {
  FINDING_URL = "finding_url",
  VALIDATING_URL = "validating_url",
  EXTRACTING_FORUM_ID = "extracting_forum_id",
  FETCHING_PAPER = "fetching_paper",
  FETCHING_NOTES = "fetching_notes",
  PROCESSING_DATA = "processing_data",
  SAVING_CONTENT = "saving_content",
  COMPLETED = "completed",
  FAILED = "failed",
}

/**
 * 处理阶段的显示文本映射
 */
const STAGE_I18N_KEYS: Record<ProcessingStage, FluentMessageId> = {
  [ProcessingStage.FINDING_URL]: "openreview-stage-finding-url",
  [ProcessingStage.VALIDATING_URL]: "openreview-stage-validating-url",
  [ProcessingStage.EXTRACTING_FORUM_ID]: "openreview-stage-extracting-forum-id",
  [ProcessingStage.FETCHING_PAPER]: "openreview-stage-fetching-paper",
  [ProcessingStage.FETCHING_NOTES]: "openreview-stage-fetching-notes",
  [ProcessingStage.PROCESSING_DATA]: "openreview-stage-processing-data",
  [ProcessingStage.SAVING_CONTENT]: "openreview-stage-saving-content",
  [ProcessingStage.COMPLETED]: "openreview-stage-completed",
  [ProcessingStage.FAILED]: "openreview-stage-failed",
};

export function getStageText(stage: ProcessingStage): string {
  return getString(STAGE_I18N_KEYS[stage]);
}

/**
 * 进度回调函数类型
 */
export type ProgressCallback = (progress: BatchProgress) => void;

/**
 * 批量处理器类
 */
export class BatchProcessor {
  private progressCallback?: ProgressCallback;
  private shouldStop = false;

  constructor(progressCallback?: ProgressCallback) {
    this.progressCallback = progressCallback;
  }

  /**
   * 停止批量处理
   */
  stop(): void {
    this.shouldStop = true;
  }

  /**
   * 重置停止标志
   */
  reset(): void {
    this.shouldStop = false;
  }

  /**
   * 检查是否应该停止处理
   */
  private checkShouldStop(): boolean {
    return this.shouldStop;
  }

  /**
   * 更新进度
   */
  private updateProgress(progress: BatchProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }

  /**
   * 计算整体进度百分比
   */
  private calculateOverallProgress(
    currentIndex: number,
    totalItems: number,
    currentItemProgress: number,
  ): number {
    if (totalItems === 0) return 0;

    const completedItems = currentIndex;
    const currentItemContribution = currentItemProgress / 100;
    const overallProgress =
      ((completedItems + currentItemContribution) / totalItems) * 100;

    return Math.min(100, Math.max(0, overallProgress));
  }

  /**
   * 处理单个条目
   */
  async processSingleItem(
    item: Zotero.Item,
    index: number,
    totalItems: number,
    currentSuccessCount: number = 0,
    currentFailureCount: number = 0,
  ): Promise<SingleItemResult> {
    const result: SingleItemResult = {
      itemId: item.id,
      title: item.getField("title") || `条目 ${item.id}`,
      success: false,
    };

    try {
      // 更新进度：开始查找URL
      this.updateProgress({
        currentIndex: index,
        totalItems,
        currentTitle: result.title,
        currentStage: getStageText(ProcessingStage.FINDING_URL),
        currentItemProgress: 0,
        overallProgress: this.calculateOverallProgress(index, totalItems, 0),
        successCount: currentSuccessCount,
        failureCount: currentFailureCount,
      });

      if (this.checkShouldStop()) {
        throw new Error(getString("openreview-error-user-cancel"));
      }

      // 查找OpenReview URL
      const openReviewUrl = await findOpenReviewUrl(item);
      if (!openReviewUrl) {
        throw new Error(getString("openreview-error-openreview-url-not-found"));
      }

      // 更新进度：验证URL
      this.updateProgress({
        currentIndex: index,
        totalItems,
        currentTitle: result.title,
        currentStage: getStageText(ProcessingStage.VALIDATING_URL),
        currentItemProgress: 10,
        overallProgress: this.calculateOverallProgress(index, totalItems, 10),
        successCount: currentSuccessCount,
        failureCount: currentFailureCount,
      });

      if (this.checkShouldStop()) {
        throw new Error(getString("openreview-error-user-cancel"));
      }

      // 验证URL格式
      ErrorHandler.validateInput(openReviewUrl, [
        ValidationRules.openReviewUrl(),
      ]);

      // 更新进度：提取forum ID
      this.updateProgress({
        currentIndex: index,
        totalItems,
        currentTitle: result.title,
        currentStage: getStageText(ProcessingStage.EXTRACTING_FORUM_ID),
        currentItemProgress: 20,
        overallProgress: this.calculateOverallProgress(index, totalItems, 20),
        successCount: currentSuccessCount,
        failureCount: currentFailureCount,
      });

      if (this.checkShouldStop()) {
        throw new Error(getString("openreview-error-user-cancel"));
      }

      // 提取forum ID
      const forumId = OpenReviewClient.extractForumId(openReviewUrl);
      if (!forumId) {
        throw new Error(getString("openreview-error-extract-forum-id-failed"));
      }

      // 更新进度：获取论文信息
      this.updateProgress({
        currentIndex: index,
        totalItems,
        currentTitle: result.title,
        currentStage: getStageText(ProcessingStage.FETCHING_PAPER),
        currentItemProgress: 30,
        overallProgress: this.calculateOverallProgress(index, totalItems, 30),
        successCount: currentSuccessCount,
        failureCount: currentFailureCount,
      });

      if (this.checkShouldStop()) {
        throw new Error(getString("openreview-error-user-cancel"));
      }

      // 创建客户端并获取数据
      const client = new OpenReviewClient();
      const rawPaper = await ErrorHandler.executeWithRetry(
        () => client.getPaperWithReviews(forumId),
        OpenReviewSettingsManager.getCurrentSettings().maxRetries,
      );

      // 更新进度：获取对话树数据
      this.updateProgress({
        currentIndex: index,
        totalItems,
        currentTitle: result.title,
        currentStage: getStageText(ProcessingStage.FETCHING_NOTES),
        currentItemProgress: 50,
        overallProgress: this.calculateOverallProgress(index, totalItems, 50),
        successCount: currentSuccessCount,
        failureCount: currentFailureCount,
      });

      if (this.checkShouldStop()) {
        throw new Error(getString("openreview-error-user-cancel"));
      }

      // 获取所有笔记以构建对话树
      const allNotes = await ErrorHandler.executeWithRetry(
        () => client.getNotes(forumId),
        OpenReviewSettingsManager.getCurrentSettings().maxRetries,
      );

      // 更新进度：处理数据
      this.updateProgress({
        currentIndex: index,
        totalItems,
        currentTitle: result.title,
        currentStage: getStageText(ProcessingStage.PROCESSING_DATA),
        currentItemProgress: 70,
        overallProgress: this.calculateOverallProgress(index, totalItems, 70),
        successCount: currentSuccessCount,
        failureCount: currentFailureCount,
      });

      if (this.checkShouldStop()) {
        throw new Error(getString("openreview-error-user-cancel"));
      }

      // 处理数据
      const processedPaper = DataProcessor.processPaper(rawPaper, allNotes);

      // 更新进度：保存内容
      this.updateProgress({
        currentIndex: index,
        totalItems,
        currentTitle: result.title,
        currentStage: getStageText(ProcessingStage.SAVING_CONTENT),
        currentItemProgress: 90,
        overallProgress: this.calculateOverallProgress(index, totalItems, 90),
        successCount: currentSuccessCount,
        failureCount: currentFailureCount,
      });

      if (this.checkShouldStop()) {
        throw new Error(getString("openreview-error-user-cancel"));
      }

      // 获取用户设置并保存内容
      const settings = OpenReviewSettingsManager.getCurrentSettings();
      let content: string;

      if (settings.saveMode === "html-note") {
        content = DataProcessor.generateInteractiveHTMLFragment(processedPaper);
        await saveReviewsAsNote(item, content, processedPaper, false);
        result.savedAs = "html-note";
      } else {
        content = DataProcessor.generatePlainMarkdownAttachment(processedPaper);
        await saveReviewsAsAttachment(item, content, processedPaper);
        result.savedAs = "markdown-attachment";
      }

      // 设置成功结果
      result.success = true;
      result.reviewCount = processedPaper.reviews.length;
      result.commentCount = processedPaper.comments.length;
      result.treeStats = processedPaper.conversationTree?.statistics
        ? {
            totalNotes: processedPaper.conversationTree.statistics.totalNotes,
          }
        : undefined;

      // 更新进度：完成
      this.updateProgress({
        currentIndex: index,
        totalItems,
        currentTitle: result.title,
        currentStage: getStageText(ProcessingStage.COMPLETED),
        currentItemProgress: 100,
        overallProgress: this.calculateOverallProgress(index, totalItems, 100),
        successCount: currentSuccessCount + 1, // 当前项目成功，立即更新计数
        failureCount: currentFailureCount,
      });
    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : String(error);

      // 更新进度：失败
      this.updateProgress({
        currentIndex: index,
        totalItems,
        currentTitle: result.title,
        currentStage: getStageText(ProcessingStage.FAILED),
        currentItemProgress: 0,
        overallProgress: this.calculateOverallProgress(index, totalItems, 0),
        successCount: currentSuccessCount,
        failureCount: currentFailureCount + 1, // 当前项目失败，立即更新计数
      });
    }

    return result;
  }

  /**
   * 批量处理多个条目
   */
  async processBatch(items: Zotero.Item[]): Promise<BatchResult> {
    const startTime = new Date();
    const results: SingleItemResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    ztoolkit.log(
      "[DEBUG] BatchProcessor - start batch processing, item count:",
      items.length,
    );

    for (let i = 0; i < items.length; i++) {
      if (this.checkShouldStop()) {
        ztoolkit.log("[DEBUG] BatchProcessor - user canceled batch processing");
        break;
      }

      const item = items[i];
      ztoolkit.log(
        `[DEBUG] BatchProcessor - process item ${i + 1}/${items.length}:`,
        item.getField("title"),
      );

      try {
        const result = await this.processSingleItem(
          item,
          i,
          items.length,
          successCount,
          failureCount,
        );
        results.push(result);

        if (result.success) {
          successCount++;
          ztoolkit.log(
            `[DEBUG] BatchProcessor - item ${i + 1} processed successfully`,
          );
        } else {
          failureCount++;
          ztoolkit.log(
            `[DEBUG] BatchProcessor - item ${i + 1} processed failed:`,
            result.error,
          );
        }

        // 注意：进度更新已在 processSingleItem 中完成，这里只更新内部计数
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        ztoolkit.log(
          `[DEBUG] BatchProcessor - item ${i + 1} processed exception:`,
          errorMessage,
        );

        const result: SingleItemResult = {
          itemId: item.id,
          title: item.getField("title") || `item ${item.id}`,
          success: false,
          error: errorMessage,
        };

        results.push(result);
        failureCount++;

        // 注意：异常情况下的进度更新应该通过统一的机制处理
      }

      // 在条目之间添加短暂延迟，避免API请求过于频繁
      if (i < items.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    const batchResult: BatchResult = {
      totalItems: items.length,
      successCount,
      failureCount,
      results,
      startTime,
      endTime,
      duration,
    };

    ztoolkit.log("[DEBUG] BatchProcessor - batch processing completed:", {
      totalItems: batchResult.totalItems,
      successCount: batchResult.successCount,
      failureCount: batchResult.failureCount,
      duration: `${duration}ms`,
    });

    return batchResult;
  }

  /**
   * 生成批量处理结果摘要
   */
  generateResultSummary(result: BatchResult): string {
    const { totalItems, successCount, failureCount, duration } = result;
    const durationSeconds = Math.round(duration / 1000);

    let summary = `${getString("openreview-batch-result-title")}\n`;
    summary += `${getString("openreview-batch-result-total")}: ${totalItems}\n`;
    summary += `${getString("openreview-batch-result-success")}: ${successCount}\n`;

    if (failureCount > 0) {
      summary += `${getString("openreview-batch-result-failure")}: ${failureCount}\n`;

      // 列出失败的条目
      const failedItems = result.results.filter((r) => !r.success);
      if (failedItems.length > 0) {
        summary += `\n${getString("openreview-batch-result-failed-items")}:\n`;
        failedItems.forEach((item, index) => {
          summary += `${index + 1}. ${item.title}: ${item.error}\n`;
        });
      }
    }

    summary += `\n${getString("openreview-batch-result-duration")}: ${durationSeconds}s`;

    // 添加成功条目的统计信息
    const successfulItems = result.results.filter((r) => r.success);
    if (successfulItems.length > 0) {
      const totalReviews = successfulItems.reduce(
        (sum, item) => sum + (item.reviewCount || 0),
        0,
      );
      const totalComments = successfulItems.reduce(
        (sum, item) => sum + (item.commentCount || 0),
        0,
      );

      summary += `\n\n${getString("openreview-batch-result-extracted")}:\n`;
      summary += `${getString("openreview-batch-result-reviews")}: ${totalReviews}\n`;
      summary += `${getString("openreview-batch-result-comments")}: ${totalComments}`;
    }

    return summary;
  }
}
