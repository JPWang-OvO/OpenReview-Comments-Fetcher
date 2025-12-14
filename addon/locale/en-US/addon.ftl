openreview-startup-begin = OpenReview Fetcher is loading
openreview-startup-finish = OpenReview Fetcher is ready
openreview-menuitem-label = Fetch OpenReview Comments
openreview-menupopup-label = OpenReview Fetcher
prefs-title = OpenReview Fetcher
prefs-table-title = Title
prefs-table-detail = Detail
tabpanel-lib-tab-label = Lib Tab
tabpanel-reader-tab-label = Reader Tab

# Startup progress formatting
openreview-startup-progress = [{ $percent }%] { $message }

# Error messages
openreview-error-user-cancel = User cancelled batch processing
openreview-error-openreview-url-not-found = OpenReview URL not found
openreview-error-extract-forum-id-failed = Failed to extract paper ID from URL
openreview-error-invalid-zotero-item = Invalid Zotero item
openreview-error-empty-content = Content is empty
openreview-error-note-save-retrieval-failed = Note save failed: unable to retrieve saved note from database
openreview-error-note-parent-mismatch = Note parent relation set failed: expected { $expected }, actual { $actual }
openreview-error-save-note-failed = Failed to save note: { $message }
openreview-error-format-text-empty = Formatted text is empty
openreview-error-invalid-paper-data = Invalid paper data
openreview-error-temp-file-create-failed = Temporary file creation failed
openreview-error-attachment-save-retrieval-failed = Attachment save failed: unable to retrieve saved attachment from database
openreview-error-save-attachment-failed = Failed to save attachment: { $message }

# General error titles and defaults
openreview-error-title = OpenReview Error
openreview-error-default-network = Network connection failed, please check your connection and retry
openreview-error-default-api = OpenReview API service error, please try again later
openreview-error-default-authentication = Authentication failed, please check username and password
openreview-error-default-rate-limit = API request rate is too high, please try again later
openreview-error-default-validation = Input data format error, please check and retry
openreview-error-default-parsing = Data parsing failed, possibly due to incorrect format
openreview-error-default-zotero = Zotero operation failed, please check Zotero status
openreview-error-default-unknown = An unknown error occurred, please retry or contact the developer

# HTTP/status-related error messages
openreview-error-request-timeout = Request timed out ({ $timeout }ms), please check network connection
openreview-error-authentication-failed = Authentication failed, please check username and password
openreview-error-access-denied = Access denied, login may be required or insufficient permissions
openreview-error-resource-not-found = Requested resource not found
openreview-error-rate-limit = API request rate is too high, please try again later
openreview-error-server-error = OpenReview server internal error
openreview-error-service-unavailable = OpenReview service is temporarily unavailable, please try again later
openreview-error-http-failed = Request failed (HTTP { $status })

# Domain-specific
openreview-error-note-not-found = Note with ID { $id } not found

# Validation messages
openreview-validation-required = Field { $field } is required
openreview-validation-url-field = Field { $field } must be a valid URL
openreview-validation-openreview-url = Must be a valid OpenReview forum URL

# Settings dialog texts
openreview-settings-title = Current OpenReview Plugin Settings
openreview-settings-save-mode = ✓ Save Mode: { $mode }
openreview-settings-include-statistics = ✓ Include Statistics: { $value }
openreview-settings-api-base-url = ✓ API Base URL: { $url }
openreview-settings-max-retries = ✓ Max Retries: { $retries }
openreview-settings-request-timeout = ✓ Request Timeout: { $timeout }ms
openreview-settings-edit-hint = To modify settings, edit Zotero preferences: extensions.openreview.*
openreview-settings-yes = Yes
openreview-settings-no = No
openreview-settings-switched-save-mode = Switched to { $mode } mode

openreview-report-section-paper-info = Paper Information
openreview-report-field-authors = Authors
openreview-report-field-created-at = Created At
openreview-report-field-extracted-at = Extracted At
openreview-report-field-abstract = Abstract
openreview-report-section-statistics = Statistics
openreview-report-field-total-notes = Total Comments
openreview-report-field-author-response-count = Author Responses
openreview-report-field-other-comment-count = Other Comments
openreview-report-field-average-rating = Average Rating
openreview-report-field-average-confidence = Average Confidence
openreview-report-field-content = Content
openreview-report-by = by
openreview-note-type-paper = Paper
openreview-note-type-decision = Decision
openreview-note-type-meta-review = Meta Review
openreview-note-type-official-review = Official Review
openreview-note-type-author-response = Author Response
openreview-note-type-comment = Comment
openreview-note-type-reply = Reply
openreview-report-field-review = Review
openreview-report-field-summary = Summary
openreview-report-field-strengths = Strengths
openreview-report-field-weaknesses = Weaknesses
openreview-report-field-questions = Questions
openreview-report-field-rating = Rating
openreview-report-field-confidence = Confidence
openreview-report-field-decision = Decision
openreview-report-field-meta-review = Meta Review
openreview-report-field-comment = Comment
openreview-report-field-total-reviews = Total Reviews
openreview-report-section-review-details = Review Details
openreview-report-field-author = Author
openreview-report-review-number = Review { $index }
