import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { CodeBlock } from './CodeBlock'

interface MarkdownProps {
  content: string
  className?: string
}

/** Markdown renderer with GFM, code highlighting, and raw HTML support */
export const Markdown = React.memo(function Markdown({ content, className }: MarkdownProps) {
  return (
    <ReactMarkdown
      className={className}
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        code({ className: cls, children, ...props }) {
          const match = /language-(\w+)/.exec(cls ?? '')
          const codeStr = String(children).replace(/\n$/, '')
          const isBlock = codeStr.includes('\n') || match

          if (isBlock) {
            return <CodeBlock language={match?.[1]}>{codeStr}</CodeBlock>
          }
          return (
            <code
              className="px-1.5 py-0.5 rounded text-sm font-mono
                bg-surface-200/60 dark:bg-surface-700/80 text-violet-600 dark:text-violet-400"
              {...props}
            >
              {children}
            </code>
          )
        },

        a({ href, children }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-600 dark:text-violet-400 hover:underline"
            >
              {children}
            </a>
          )
        },

        table({ children }) {
          return (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full border-collapse text-sm">{children}</table>
            </div>
          )
        },
        th({ children }) {
          return (
            <th className="border border-surface-300 dark:border-surface-600 px-3 py-2 bg-surface-200 dark:bg-surface-800 font-semibold text-left">
              {children}
            </th>
          )
        },
        td({ children }) {
          return (
            <td className="border border-surface-300 dark:border-surface-600 px-3 py-2">
              {children}
            </td>
          )
        },

        blockquote({ children }) {
          return (
            <blockquote className="border-l-4 border-primary/50 dark:border-primary/50 pl-4 my-3 text-surface-600 dark:text-surface-400 italic">
              {children}
            </blockquote>
          )
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
})
