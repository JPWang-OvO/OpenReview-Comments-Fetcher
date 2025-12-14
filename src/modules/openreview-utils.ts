import { DataProcessor } from "./data-processor";
import { getString } from "../utils/locale";

export async function findOpenReviewUrl(
  item: Zotero.Item,
): Promise<string | null> {
  if (item.getField("url")) {
    const url = item.getField("url") as string;
    if (url.includes("openreview.net")) {
      return url;
    }
  }

  if (item.getField("DOI")) {
    const doi = item.getField("DOI") as string;
    void doi;
  }

  const attachments = item.getAttachments();
  for (const attachmentID of attachments) {
    const attachment = Zotero.Items.get(attachmentID);
    if (attachment.getField("url")) {
      const url = attachment.getField("url") as string;
      if (url.includes("openreview.net")) {
        return url;
      }
    }
  }

  const notes = item.getNotes();
  for (const noteID of notes) {
    const note = Zotero.Items.get(noteID);
    const noteContent = note.getNote();
    const urlMatch = noteContent.match(/https?:\/\/openreview\.net\/[^\s<>"]+/);
    if (urlMatch) {
      return urlMatch[0];
    }
  }

  return null;
}

export async function saveReviewsAsNote(
  item: Zotero.Item,
  content: string,
  paper: any,
  isMarkdown: boolean = false,
): Promise<number> {
  try {
    ztoolkit.log("[DEBUG] saveReviewsAsNote - Start saving note");
    ztoolkit.log("[DEBUG] saveReviewsAsNote - Item ID:", item.id);
    ztoolkit.log("[DEBUG] saveReviewsAsNote - Content length:", content.length);
    ztoolkit.log("[DEBUG] saveReviewsAsNote - Paper ID:", paper.id);
    ztoolkit.log("[DEBUG] saveReviewsAsNote - is Markdown?:", isMarkdown);

    if (!item || !item.id) {
      throw new Error(getString("openreview-error-invalid-zotero-item"));
    }

    if (!content || content.trim().length === 0) {
      throw new Error(getString("openreview-error-empty-content"));
    }

    ztoolkit.log("[DEBUG] saveReviewsAsNote - create new Zotero note item");
    const note = new Zotero.Item("note");

    let htmlContent: string;
    if (isMarkdown) {
      ztoolkit.log(
        "[DEBUG] saveReviewsAsNote - convert Markdown to HTML format",
      );
      htmlContent = DataProcessor.convertMarkdownToHTML(content);
      ztoolkit.log(
        "[DEBUG] saveReviewsAsNote - HTML content length:",
        htmlContent.length,
      );
    } else {
      ztoolkit.log("[DEBUG] saveReviewsAsNote - use HTML content");
      htmlContent = content;
    }

    ztoolkit.log("[DEBUG] saveReviewsAsNote - set note content");
    note.setNote(htmlContent);

    ztoolkit.log("[DEBUG] saveReviewsAsNote - set parent item ID");
    note.parentItemID = item.id;

    ztoolkit.log("[DEBUG] saveReviewsAsNote - set library ID:", item.libraryID);
    note.libraryID = item.libraryID;

    ztoolkit.log("[DEBUG] saveReviewsAsNote - start saving note to database");
    await note.saveTx();

    ztoolkit.log(
      "[DEBUG] saveReviewsAsNote - note save successful, note ID:",
      note.id,
    );

    const savedNote = Zotero.Items.get(note.id);
    if (!savedNote) {
      throw new Error(getString("openreview-error-note-save-retrieval-failed"));
    }

    if (savedNote.parentItemID !== item.id) {
      throw new Error(
        getString("openreview-error-note-parent-mismatch", {
          args: { expected: item.id, actual: savedNote.parentItemID },
        }),
      );
    }

    ztoolkit.log(
      "[DEBUG] saveReviewsAsNote - note verification successful, parent item ID:",
      savedNote.parentItemID,
    );

    return note.id;
  } catch (error) {
    ztoolkit.log("[DEBUG] saveReviewsAsNote - error while saving note:", error);
    ztoolkit.log(
      "[DEBUG] saveReviewsAsNote - error stack trace:",
      error instanceof Error ? error.stack : "No stack trace",
    );
    throw new Error(
      getString("openreview-error-save-note-failed", {
        args: {
          message: error instanceof Error ? error.message : String(error),
        },
      }),
    );
  }
}

export async function saveReviewsAsAttachment(
  item: Zotero.Item,
  formattedText: string,
  paper: any,
): Promise<Zotero.Item> {
  try {
    ztoolkit.log("[DEBUG] saveReviewsAsAttachment - start saving attachment");
    ztoolkit.log("[DEBUG] saveReviewsAsAttachment - item ID:", item.id);
    ztoolkit.log(
      "[DEBUG] saveReviewsAsAttachment - text length:",
      formattedText.length,
    );
    ztoolkit.log("[DEBUG] saveReviewsAsAttachment - paper ID:", paper.id);

    if (!item || !item.id) {
      throw new Error(getString("openreview-error-invalid-zotero-item"));
    }

    if (!formattedText || formattedText.trim().length === 0) {
      throw new Error(getString("openreview-error-format-text-empty"));
    }

    if (!paper || !paper.id) {
      throw new Error(getString("openreview-error-invalid-paper-data"));
    }

    const fileExtension = "md";
    const filename = `OpenReview_Rebuttals_${paper.id}.${fileExtension}`;

    ztoolkit.log("[DEBUG] saveReviewsAsAttachment - filename:", filename);
    ztoolkit.log("[DEBUG] saveReviewsAsAttachment - file format: Markdown");

    const tempFile = Zotero.getTempDirectory();
    tempFile.append(filename);
    ztoolkit.log(
      "[DEBUG] saveReviewsAsAttachment - temp file path:",
      tempFile.path,
    );

    ztoolkit.log("[DEBUG] saveReviewsAsAttachment - write to temp file");
    await Zotero.File.putContentsAsync(tempFile, formattedText);

    if (!tempFile.exists()) {
      throw new Error(getString("openreview-error-temp-file-create-failed"));
    }

    ztoolkit.log(
      "[DEBUG] saveReviewsAsAttachment - temp file create successful, size:",
      tempFile.fileSize,
    );

    ztoolkit.log("[DEBUG] saveReviewsAsAttachment - create Zotero attachment");
    const attachmentTitle = `OpenReview Reviews - ${paper.title} (Markdown)`;
    const attachment = await Zotero.Attachments.importFromFile({
      file: tempFile,
      parentItemID: item.id,
      title: attachmentTitle,
    });

    ztoolkit.log(
      "[DEBUG] saveReviewsAsAttachment - attachment create successful, attachment ID:",
      attachment.id,
    );

    ztoolkit.log("[DEBUG] saveReviewsAsAttachment - delete temp file");
    if (tempFile.exists()) {
      tempFile.remove(false);
      ztoolkit.log("[DEBUG] saveReviewsAsAttachment - temp file deleted");
    }

    const savedAttachment = Zotero.Items.get(attachment.id);
    if (!savedAttachment) {
      throw new Error(
        getString("openreview-error-attachment-save-retrieval-failed"),
      );
    }

    ztoolkit.log(
      "[DEBUG] saveReviewsAsAttachment - attachment verification successful",
    );

    return attachment;
  } catch (error) {
    ztoolkit.log(
      "[DEBUG] saveReviewsAsAttachment - error while saving attachment:",
      error,
    );
    ztoolkit.log(
      "[DEBUG] saveReviewsAsAttachment - error stack trace:",
      error instanceof Error ? error.stack : "No stack trace",
    );
    throw new Error(
      getString("openreview-error-save-attachment-failed", {
        args: {
          message: error instanceof Error ? error.message : String(error),
        },
      }),
    );
  }
}
