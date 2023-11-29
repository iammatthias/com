import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import remarkImages from "remark-images";
import remarkUnwrapImages from "remark-unwrap-images";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypePrism from "@mapbox/rehype-prism";
import rehypeStringify from "rehype-stringify";
import Link from "next/link";
import Iframe from "../components/iframe";
import MasonryComponent from "../components/masonry";
import RemoteImage from "../components/remote_image";
import Video from "../components/video";

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
    if (props.href.includes(".jpg") || props.href.includes(".png") || props.href.includes(".gif")) {
      return props.children;
    }
    return <Link href={props.href}>{props.children}</Link>;
  },
  img: (props: any) => {
    return <RemoteImage {...props} />;
  },
  p: (props: any) => {
    return <p>{props.children}</p>;
  },
};

export function CustomMDX(originalProps: any) {
  const imgurRegex = /(https:\/\/i\.imgur\.com\/\S+)/g;

  // Clone the original props to avoid modifying the original object
  let props = JSON.parse(JSON.stringify(originalProps));

  // Recursively process the object to look for `source` keys and modify them if necessary
  const processData = (obj: any) => {
    for (let key in obj) {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        processData(obj[key]);
      } else if (key === "source" && typeof obj[key] === "string") {
        obj[key] = obj[key].replace(imgurRegex, "\n\n$1");
      }
    }
  };

  processData(props);

  return (
    <MDXRemote
      {...props}
      components={{ ...components }}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm, remarkImages, remarkUnwrapImages],
          rehypePlugins: [rehypePrism, rehypeStringify],
        },
      }}
    />
  );
}
