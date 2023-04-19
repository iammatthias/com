import React, { ReactElement, ReactNode } from "react";
import Link from "next/link";

interface LinkAttributes {
  [key: string]: any;
}

type AutoLinkProps = {
  text: string;
  options?: {
    callback?: (url: string) => ReactNode;
  } & LinkAttributes;
};

export default function AutoLink({
  text,
  options = {},
}: AutoLinkProps): ReactElement {
  const urlPattern =
    /(^|[\s\n]|<[A-Za-z]*\/?>)((?:https?|ftp):\/\/[\-A-Z0-9+\u0026\u2019@#\/%?=()~_|!:,.;]*[\-A-Z0-9+\u0026@#\/%=()~_|])/gi;
  const usernamePattern = /(^|\s)(@[A-Za-z0-9_]+)(?=[^A-Za-z0-9_]|$)/gi;

  function replaceURLsAndUsernames(str: string): ReactNode[] {
    const parts: ReactNode[] = [];

    let lastIndex = 0;
    let match;

    const matches: Array<{
      pattern: RegExp;
      index: number;
      match: RegExpExecArray;
    }> = [];

    while ((match = urlPattern.exec(str)) !== null) {
      matches.push({ pattern: urlPattern, index: match.index, match });
    }

    while ((match = usernamePattern.exec(str)) !== null) {
      matches.push({ pattern: usernamePattern, index: match.index, match });
    }

    matches.sort((a, b) => a.index - b.index);

    for (const { pattern, index, match } of matches) {
      parts.push(str.slice(lastIndex, index));
      lastIndex = index + match[0].length;

      let link: ReactNode;

      if (pattern === urlPattern) {
        link = (
          <Link href={match[2]} {...options} key={match[2]}>
            {match[2]}
          </Link>
        );
        parts.push(match[1]);
      } else {
        link = (
          <Link
            href={`https://www.discove.xyz/${match[2]}?a=new`}
            key={match[2]}>
            {match[2]}
          </Link>
        );
        parts.push(match[1]);
      }

      parts.push(link);
    }

    if (lastIndex < str.length) {
      parts.push(str.slice(lastIndex));
    }

    return parts;
  }

  return <p>{replaceURLsAndUsernames(text)}</p>;
}
