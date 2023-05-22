import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import Iframe from "@/app/components/mdx/iframe";
import Video from "@/app/components/mdx/video";
import MasonryComponent from "../components/mdx/masonry";
import RemoteImage from "../components/mdx/remoteImage";

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
