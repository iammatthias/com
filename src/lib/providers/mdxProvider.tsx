import RemoteImage from "@/ui/remoteImage";
import Token from "@/ui/token";
import Link from "next/link";

function P(props: any) {
  if (props.children?.props?.src) {
    const src = props.children.props.src;
    const alt = props.children.props.alt || "";
    return (
      <RemoteImage
        {...props}
        src={`https://pub-8bcf4a42832e4273a5a34c696ccc1b55.r2.dev/${src}`}
        alt={alt}
      />
    );
  }
  return <p>{props.children}</p>;
}

function A(props: any) {
  return <Link href={props.href}>{props.children}</Link>;
}

export const Components = {
  p: P,
  a: A,
  Token: Token,
};
