import dynamic from "next/dynamic";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import remarkImages from "remark-images";
import remarkUnwrapImages from "remark-unwrap-images";
import Link from "next/link";

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
  a: (props: any) => {
    if (props.href.includes("imgur")) {
      return <>{props.children}</>;
    }
    return <Link href={props.href}>{props.children}</Link>;
  },
  img: (props: any) => {
    return <RemoteImage {...props} />;
  },
  p: (props: any) => {
    // if props.children is an array of objects we map through them and unwrap them
    if (Array.isArray(props.children)) {
      return props.children.map((child: any) => {
        return <>{child}</>;
      });
    }

    return <p>{props.children}</p>;
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
            remarkPlugins: [remarkGfm, remarkImages, remarkUnwrapImages],
          },
        }}
      />
    </>
  );
}
