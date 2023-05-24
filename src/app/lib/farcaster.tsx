import React, { ReactElement, ReactNode, memo } from "react";
import Link from "next/link";

async function fetchFromAPI(endpoint: string) {
  try {
    const res = await fetch(endpoint);
    const data = await res.json();

    // Check if data.casts is an array. If not, return an empty array.
    if (!Array.isArray(data.casts)) {
      console.warn("Data.casts from API was not an array:", data);
      return [];
    }

    return data.casts;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

export function fetchMerkleRootCasts(merkleRoot: string) {
  return fetchFromAPI(
    `https://searchcaster.xyz/api/search?merkleRoot=${encodeURIComponent(
      merkleRoot
    )}`
  );
}

export function fetchTopLevelCasts(slug: string) {
  return fetchFromAPI(
    `https://searchcaster.xyz/api/search?text=${encodeURIComponent(slug)}`
  );
}

interface LinkAttributes {
  [key: string]: any;
}

type AutoLinkProps = {
  text: string;
  options?: {
    callback?: (url: string) => ReactNode;
  } & LinkAttributes;
};

const AutoLink = ({ text, options = {} }: AutoLinkProps): ReactElement => {
  const urlPattern =
    /(^|[\s\n]|<[A-Za-z]*\/?>)((?:https?|ftp):\/\/[\-A-Z0-9+\u0026\u2019@#\/%?=()~_|!:,.;]*[\-A-Z0-9+\u0026@#\/%=()~_|])/gi;
  const usernamePattern = /(^|\s)(@[A-Za-z0-9_]+)(?=[^A-Za-z0-9_]|$)/gi;

  const makeLink = (match: RegExpExecArray, url: string) => (
    <Link href={url} {...options} key={match[2]}>
      {match[2]}
    </Link>
  );

  const makeUsernameLink = (match: RegExpExecArray) => (
    <Link href={`https://www.discove.xyz/${match[2]}?a=new`} key={match[2]}>
      {match[2]}
    </Link>
  );

  const findMatches = (
    pattern: RegExp,
    action: (match: RegExpExecArray, url: string) => ReactNode,
    url: string = ""
  ) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      parts.push(text.slice(lastIndex, match.index));
      parts.push(match[1]);
      parts.push(action(match, url));
      lastIndex = match.index + match[0].length;
    }
  };

  let lastIndex = 0;
  const parts: ReactNode[] = [];

  findMatches(urlPattern, makeLink, text);
  findMatches(usernamePattern, makeUsernameLink, text);

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <p>{parts}</p>;
};

export default memo(AutoLink);
