import { marked } from "marked";
import DOMPurify from "dompurify";

marked.setOptions({ gfm: true, breaks: false });

// Links in model output open in a new tab and never carry the opener.
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
});

/**
 * Render model markdown to sanitized HTML. Model output is untrusted input.
 * @param {string} text
 * @returns {string}
 */
export function renderMarkdown(text) {
  const html = marked.parse(text ?? "", { async: false });
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ["style", "img", "iframe", "form", "input"],
    FORBID_ATTR: ["style"],
  });
}
