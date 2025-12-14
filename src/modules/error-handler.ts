/**
 * OpenReview 插件错误处理模块
 * 统一处理网络错误、API限制、认证失败等各种异常情况
 */
import { getString } from "../utils/locale";

export enum ErrorType {
  NETWORK_ERROR = "NETWORK_ERROR",
  API_ERROR = "API_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  PARSING_ERROR = "PARSING_ERROR",
  ZOTERO_ERROR = "ZOTERO_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export interface ErrorDetails {
  type: ErrorType;
  message: string;
  originalError?: Error;
  statusCode?: number;
  retryable?: boolean;
  userMessage?: string;
}

export class OpenReviewError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode?: number;
  public readonly retryable: boolean;
  public readonly userMessage: string;
  public readonly originalError?: Error;

  constructor(details: ErrorDetails) {
    super(details.message);
    this.name = "OpenReviewError";
    this.type = details.type;
    this.statusCode = details.statusCode;
    this.retryable = details.retryable ?? false;
    this.userMessage =
      details.userMessage ?? this.getDefaultUserMessage(details.type);
    this.originalError = details.originalError;
  }

  private getDefaultUserMessage(type: ErrorType): string {
    switch (type) {
      case ErrorType.NETWORK_ERROR:
        return getString("openreview-error-default-network");
      case ErrorType.API_ERROR:
        return getString("openreview-error-default-api");
      case ErrorType.AUTHENTICATION_ERROR:
        return getString("openreview-error-default-authentication");
      case ErrorType.RATE_LIMIT_ERROR:
        return getString("openreview-error-default-rate-limit");
      case ErrorType.VALIDATION_ERROR:
        return getString("openreview-error-default-validation");
      case ErrorType.PARSING_ERROR:
        return getString("openreview-error-default-parsing");
      case ErrorType.ZOTERO_ERROR:
        return getString("openreview-error-default-zotero");
      default:
        return getString("openreview-error-default-unknown");
    }
  }
}

export class ErrorHandler {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAYS = [1000, 2000, 4000]; // 指数退避

  /**
   * 分析并分类错误
   */
  static analyzeError(error: any): OpenReviewError {
    // 如果已经是 OpenReviewError，直接返回
    if (error instanceof OpenReviewError) {
      return error;
    }

    // 网络错误
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return new OpenReviewError({
        type: ErrorType.NETWORK_ERROR,
        message: `Network error: ${error.message}`,
        originalError: error,
        retryable: true,
      });
    }

    // HTTP 状态码错误
    if (error.message?.includes("HTTP error")) {
      const statusMatch = error.message.match(/status: (\d+)/);
      const statusCode = statusMatch ? parseInt(statusMatch[1]) : undefined;

      if (statusCode === 401 || statusCode === 403) {
        return new OpenReviewError({
          type: ErrorType.AUTHENTICATION_ERROR,
          message: `Authentication failed: ${error.message}`,
          statusCode,
          originalError: error,
          retryable: false,
        });
      }

      if (statusCode === 429) {
        return new OpenReviewError({
          type: ErrorType.RATE_LIMIT_ERROR,
          message: `Rate limit exceeded: ${error.message}`,
          statusCode,
          originalError: error,
          retryable: true,
        });
      }

      if (statusCode && statusCode >= 500) {
        return new OpenReviewError({
          type: ErrorType.API_ERROR,
          message: `Server error: ${error.message}`,
          statusCode,
          originalError: error,
          retryable: true,
        });
      }

      return new OpenReviewError({
        type: ErrorType.API_ERROR,
        message: `API error: ${error.message}`,
        statusCode,
        originalError: error,
        retryable: false,
      });
    }

    // JSON 解析错误
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return new OpenReviewError({
        type: ErrorType.PARSING_ERROR,
        message: `JSON parsing error: ${error.message}`,
        originalError: error,
        retryable: false,
      });
    }

    // Zotero 相关错误
    if (error.message?.includes("Zotero") || error.name?.includes("Zotero")) {
      return new OpenReviewError({
        type: ErrorType.ZOTERO_ERROR,
        message: `Zotero error: ${error.message}`,
        originalError: error,
        retryable: false,
      });
    }

    // 默认未知错误
    return new OpenReviewError({
      type: ErrorType.UNKNOWN_ERROR,
      message: error.message || "Unknown error occurred",
      originalError: error,
      retryable: false,
    });
  }

  /**
   * 带重试机制的异步操作执行
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.MAX_RETRIES,
    onRetry?: (attempt: number, error: OpenReviewError) => void,
  ): Promise<T> {
    let lastError: OpenReviewError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = this.analyzeError(error);

        // 如果不可重试或已达到最大重试次数，抛出错误
        if (!lastError.retryable || attempt === maxRetries) {
          throw lastError;
        }

        // 调用重试回调
        if (onRetry) {
          onRetry(attempt + 1, lastError);
        }

        // 等待后重试
        if (attempt < maxRetries) {
          const delay =
            this.RETRY_DELAYS[Math.min(attempt, this.RETRY_DELAYS.length - 1)];
          await this.delay(delay);
        }
      }
    }

    throw lastError!;
  }

  /**
   * 记录错误到控制台
   */
  static logError(error: OpenReviewError, context?: string): void {
    const prefix = context ? `[${context}]` : "[OpenReview]";

    ztoolkit.log(`${prefix} Error: ${error.type}`);
    ztoolkit.log("Message:", error.message);
    ztoolkit.log("User Message:", error.userMessage);

    if (error.statusCode) {
      ztoolkit.log("Status Code:", error.statusCode);
    }

    ztoolkit.log("Retryable:", error.retryable);

    if (error.originalError) {
      ztoolkit.log("Original Error:", error.originalError);
    }
  }

  /**
   * 显示用户友好的错误消息
   */
  static showUserError(error: OpenReviewError, context?: string): void {
    this.logError(error, context);

    // 使用 ztoolkit 显示错误消息
    const title = context
      ? `${context} - ${getString("openreview-error-title")}`
      : getString("openreview-error-title");

    new ztoolkit.ProgressWindow(title, {
      closeOnClick: true,
      closeTime: 8000,
    })
      .createLine({
        text: error.userMessage,
        type: "error",
        progress: undefined,
      })
      .show();
  }

  /**
   * 验证输入数据
   */
  static validateInput(data: any, rules: ValidationRule[]): void {
    for (const rule of rules) {
      if (!rule.validate(data)) {
        throw new OpenReviewError({
          type: ErrorType.VALIDATION_ERROR,
          message: `Validation failed: ${rule.message}`,
          userMessage: rule.userMessage || rule.message,
        });
      }
    }
  }

  /**
   * 延迟函数
   */
  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export interface ValidationRule {
  validate: (data: any) => boolean;
  message: string;
  userMessage?: string;
}

// 常用验证规则
export const ValidationRules = {
  required: (field: string): ValidationRule => ({
    validate: (data) => data && data[field] != null && data[field] !== "",
    message: getString("openreview-validation-required", { args: { field } }),
    userMessage: getString("openreview-validation-required", {
      args: { field },
    }),
  }),

  url: (field: string): ValidationRule => ({
    validate: (data) => {
      if (!data[field]) return true; // 可选字段
      try {
        new URL(data[field]);
        return true;
      } catch {
        return false;
      }
    },
    message: getString("openreview-validation-url-field", { args: { field } }),
    userMessage: getString("openreview-validation-url-field", {
      args: { field },
    }),
  }),

  openReviewUrl: (): ValidationRule => ({
    validate: (url) => {
      if (typeof url !== "string") return false;
      return url.includes("openreview.net") && url.includes("forum");
    },
    message: getString("openreview-validation-openreview-url"),
    userMessage: getString("openreview-validation-openreview-url"),
  }),
};
