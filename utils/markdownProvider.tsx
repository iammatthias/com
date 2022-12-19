import ReactMarkdown, { uriTransformer } from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { components } from './markdownComponents';

export default function MarkdownProvider({ children }: any) {
  return (
    <ReactMarkdown
      transformLinkUri={uriTransformer}
      rehypePlugins={[rehypeRaw]}
      components={{
        // iframe: components.iframe,
        p: components.paragraph as any,
        div: components.div as any,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
