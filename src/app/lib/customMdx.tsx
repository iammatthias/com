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
    return <Link href={props.href}>{props.children}</Link>;
  },
  img: (props: any) => {
    return <RemoteImage {...props} />;
  },
  p: (props: any) => {
    // console.log({ props });

    // if props.children is an array, it means that there are nested elements
    // if the nested element is an imgur link (a) then we want to unwrap it

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
