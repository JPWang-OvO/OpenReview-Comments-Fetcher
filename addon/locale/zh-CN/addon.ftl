openreview-startup-begin = OpenReview Fetcher 正在加载
openreview-startup-finish = OpenReview Fetcher 已就绪
openreview-menuitem-label = 获取OpenReview评论
openreview-menupopup-label = OpenReview Fetcher
prefs-title = OpenReview Fetcher
prefs-table-title = 标题
prefs-table-detail = 详情
tabpanel-lib-tab-label = 库标签
tabpanel-reader-tab-label = 阅读器标签

# 启动进度格式
openreview-startup-progress = [{ $percent }%] { $message }

# 错误消息
openreview-error-user-cancel = 用户取消了批量处理
openreview-error-openreview-url-not-found = 未找到 OpenReview 链接
openreview-error-extract-forum-id-failed = 无法从URL中提取论文ID
openreview-error-invalid-zotero-item = 无效的 Zotero 条目
openreview-error-empty-content = 内容为空
openreview-error-note-save-retrieval-failed = 笔记保存失败：无法从数据库中检索保存的笔记
openreview-error-note-parent-mismatch = 笔记父条目关系设置失败：期望 { $expected }，实际 { $actual }
openreview-error-save-note-failed = 保存笔记失败: { $message }
openreview-error-format-text-empty = 格式化文本为空
openreview-error-invalid-paper-data = 无效的论文数据
openreview-error-temp-file-create-failed = 临时文件创建失败
openreview-error-attachment-save-retrieval-failed = 附件保存失败：无法从数据库中检索保存的附件
openreview-error-save-attachment-failed = 保存附件失败: { $message }

# 通用错误标题与默认消息
openreview-error-title = OpenReview 错误
openreview-error-default-network = 网络连接失败，请检查网络连接后重试
openreview-error-default-api = OpenReview API 服务异常，请稍后重试
openreview-error-default-authentication = 认证失败，请检查用户名和密码
openreview-error-default-rate-limit = API 请求频率过高，请稍后重试
openreview-error-default-validation = 输入数据格式错误，请检查后重试
openreview-error-default-parsing = 数据解析失败，可能是数据格式不正确
openreview-error-default-zotero = Zotero 操作失败，请检查 Zotero 状态
openreview-error-default-unknown = 发生未知错误，请重试或联系开发者

# HTTP/状态相关错误消息
openreview-error-request-timeout = 请求超时（{ $timeout }ms），请检查网络连接
openreview-error-authentication-failed = 认证失败，请检查用户名和密码
openreview-error-access-denied = 访问被拒绝，可能需要登录或权限不足
openreview-error-resource-not-found = 请求的资源不存在
openreview-error-rate-limit = API 请求频率过高，请稍后重试
openreview-error-server-error = OpenReview 服务器内部错误
openreview-error-service-unavailable = OpenReview 服务暂时不可用，请稍后重试
openreview-error-http-failed = 请求失败 (HTTP { $status })

# 领域特定
openreview-error-note-not-found = 未找到ID为 { $id } 的论文

# 验证消息
openreview-validation-required = { $field } 字段是必需的
openreview-validation-url-field = { $field } 必须是有效的URL
openreview-validation-openreview-url = 必须是有效的 OpenReview 论文链接

# 设置对话框文案
openreview-settings-title = 当前 OpenReview 插件设置
openreview-settings-save-mode = ✓ 保存模式: { $mode }
openreview-settings-include-statistics = ✓ 包含统计信息: { $value }
openreview-settings-api-base-url = ✓ API 基础URL: { $url }
openreview-settings-max-retries = ✓ 最大重试次数: { $retries }
openreview-settings-request-timeout = ✓ 请求超时: { $timeout }ms
openreview-settings-edit-hint = 要修改设置，请编辑 Zotero 首选项中的 extensions.openreview.* 项目。
openreview-settings-yes = 是
openreview-settings-no = 否
openreview-settings-switched-save-mode = 已切换到 { $mode } 模式

openreview-report-section-paper-info = 论文信息
openreview-report-field-authors = 作者
openreview-report-field-created-at = 创建时间
openreview-report-field-extracted-at = 提取时间
openreview-report-field-abstract = 摘要
openreview-report-section-statistics = 统计信息
openreview-report-field-total-notes = 总评论数
openreview-report-field-author-response-count = 作者回复数
openreview-report-field-other-comment-count = 其他评论数
openreview-report-field-average-rating = 平均评分
openreview-report-field-average-confidence = 平均置信度
openreview-report-field-content = 内容
openreview-report-by = 作者
openreview-note-type-paper = 论文
openreview-note-type-decision = 决定
openreview-note-type-meta-review = Meta Review
openreview-note-type-official-review = 官方评审
openreview-note-type-author-response = 作者回复
openreview-note-type-comment = 评论
openreview-note-type-reply = 回复
openreview-report-field-review = 评审
openreview-report-field-summary = 总结
openreview-report-field-strengths = 优点
openreview-report-field-weaknesses = 缺点
openreview-report-field-questions = 问题
openreview-report-field-rating = 评分
openreview-report-field-confidence = 置信度
openreview-report-field-decision = 决定
openreview-report-field-meta-review = Meta Review
openreview-report-field-comment = 评论
openreview-report-field-total-reviews = 总评审数
openreview-report-section-review-details = 评审详情
openreview-report-field-author = 作者
openreview-report-review-number = 评审 { $index }
