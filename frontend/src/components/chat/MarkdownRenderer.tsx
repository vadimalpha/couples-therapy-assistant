import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Custom components for react-markdown to match OpenAI/ChatGPT styling
 */
const markdownComponents: Components = {
  // Paragraphs with proper spacing
  p: ({ children }) => <p className="md-paragraph">{children}</p>,

  // Headers with visual hierarchy
  h1: ({ children }) => <h1 className="md-heading md-h1">{children}</h1>,
  h2: ({ children }) => <h2 className="md-heading md-h2">{children}</h2>,
  h3: ({ children }) => <h3 className="md-heading md-h3">{children}</h3>,
  h4: ({ children }) => <h4 className="md-heading md-h4">{children}</h4>,

  // Lists with proper indentation
  ul: ({ children }) => <ul className="md-list md-ul">{children}</ul>,
  ol: ({ children }) => <ol className="md-list md-ol">{children}</ol>,
  li: ({ children }) => <li className="md-list-item">{children}</li>,

  // Code blocks and inline code
  code: ({ className, children, ...props }) => {
    const isInline = !className;
    if (isInline) {
      return <code className="md-inline-code" {...props}>{children}</code>;
    }
    return (
      <code className={`md-code-block ${className || ''}`} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => <pre className="md-pre">{children}</pre>,

  // Blockquotes for emphasis
  blockquote: ({ children }) => (
    <blockquote className="md-blockquote">{children}</blockquote>
  ),

  // Strong and emphasis
  strong: ({ children }) => <strong className="md-strong">{children}</strong>,
  em: ({ children }) => <em className="md-em">{children}</em>,

  // Links
  a: ({ href, children }) => (
    <a href={href} className="md-link" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),

  // Horizontal rule
  hr: () => <hr className="md-hr" />,

  // Tables (if used)
  table: ({ children }) => (
    <div className="md-table-wrapper">
      <table className="md-table">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="md-thead">{children}</thead>,
  tbody: ({ children }) => <tbody className="md-tbody">{children}</tbody>,
  tr: ({ children }) => <tr className="md-tr">{children}</tr>,
  th: ({ children }) => <th className="md-th">{children}</th>,
  td: ({ children }) => <td className="md-td">{children}</td>,
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
}) => {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        components={markdownComponents}
        rehypePlugins={[rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
