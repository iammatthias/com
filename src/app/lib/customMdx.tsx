import dynamic from "next/dynamic";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";

const Iframe = dynamic(() => import("@/app/components/mdx/iframe"), {
  loading: () => <p>Loading...</p>,
});

const Video = dynamic(() => import("@/app/components/mdx/video"), {
  loading: () => <p>Loading...</p>,
});

const MasonryComponent = dynamic(() => import("@/app/components/mdx/masonry"), {
  loading: () => <p>Loading...</p>,
});

const RemoteImage = dynamic(() => import("@/app/components/mdx/remoteImage"), {
  loading: () => <p>Loading...</p>,
});

const components = {
  Iframe: (props: any) => {
    return <Iframe {...props} />;
  },
  Video: (props: any) => {
    return <Video {...props} />;
  },
  Masonry: (props: any) => {
    return <MasonryComponent items={props.items} />;
  },
  Image: (props: any) => {
    return <RemoteImage {...props} />;
  },
};

export function CustomMDX(props: any) {
  return (
    <>
      {/* @ts-expect-error Async Server Component */}
      <MDXRemote
        {...props}
        components={{ ...components }}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
          },
        }}
      />
    </>
  );
}
