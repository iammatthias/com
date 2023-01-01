import ReactMarkdown, { uriTransformer } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { components } from './markdownComponents';

export default function MarkdownProvider({ children }: any) {
  return (
    <ReactMarkdown
      transformLinkUri={uriTransformer}
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        iframe: components.iframe,
        p: components.paragraph as any,
        div: components.div as any,
        a: components.a as any,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
