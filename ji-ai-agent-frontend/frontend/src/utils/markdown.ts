const MARKDOWN_PATTERN = /[#*>\[\]_~]/

/**
 * Detect if content needs Markdown rendering.
 * Heuristic: presence of common Markdown syntax characters.
 */
export function needsMarkdown(content: string): boolean {
  const backtick = '\x60'
  return (
    MARKDOWN_PATTERN.test(content) ||
    content.includes(backtick) ||
    content.includes('\n')
  )
}

const CODE_BLOCK_RE = /[\x60]{3}[\s\S]*?[\x60]{3}/g
const INLINE_CODE_RE = /[\x60][^\x60]+[\x60]/g
const HEADING_RE = /#{1,6}\s/g
const BOLD_ITALIC_RE = /[*_~]{1,3}/g
const LINK_RE = /\[([^\]]+)\]\([^)]+\)/g
const BLOCKQUOTE_RE = />/g

/** Strip Markdown syntax for plain-text preview or search indexing. */
export function stripMarkdown(content: string): string {
  return content
    .replace(CODE_BLOCK_RE, '')
    .replace(INLINE_CODE_RE, '')
    .replace(HEADING_RE, '')
    .replace(BOLD_ITALIC_RE, '')
    .replace(LINK_RE, '$1')
    .replace(BLOCKQUOTE_RE, '')
    .trim()
}
