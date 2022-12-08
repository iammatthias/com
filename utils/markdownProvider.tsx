import ReactMarkdown, { uriTransformer } from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkDirective from 'remark-directive';
import remarkDirectiveRehype from 'remark-directive-rehype';
import { components } from './markdownComponents';

export default function MarkdownProvider({ children }: any) {
  return (
    <ReactMarkdown
      transformLinkUri={uriTransformer}
      remarkPlugins={[remarkDirective, remarkDirectiveRehype]}
      rehypePlugins={[rehypeRaw]}
      components={{
        iframe: components.iframe,
        p: components.paragraph as any,
        nft: components.nft,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
