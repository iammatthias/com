// A flexible box component that can be used to build layouts.
// Defaults to a <div>, but can be customized with the `as` prop.
// Uses Next/Link for <a> tags.

import { createElement, AllHTMLAttributes, ElementType } from 'react';
import Link, { LinkProps } from 'next/link';

type BoxProps = {
  as?: ElementType;
  slug?: string;
} & AllHTMLAttributes<HTMLElement>;

function BoxPrimitive({ as = 'div', ...props }: BoxProps) {
  return createElement(as, props);
}

function LinkPrimitive({ ...props }: BoxProps & LinkProps) {
  return <Link {...props} href={`${props?.slug}`} />;
}

export default function Box({ as = 'div', ...props }: BoxProps) {
  if (as === 'a') {
    return <LinkPrimitive href={`${props.slug}`} {...props} />;
  }

  return <BoxPrimitive as={as} {...props} />;
}
