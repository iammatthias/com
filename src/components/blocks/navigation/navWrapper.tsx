import { styled } from '@/styles/stitches.config';

import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu';
import NavQuery from './navQuery';
import ThemeToggle from '@/components/joy/themeToggle';

import {
  CaretDownIcon,
  HomeIcon,
  CameraIcon,
  FileTextIcon,
  FaceIcon,
  ArrowRightIcon,
  Pencil2Icon,
  MixIcon,
} from '@radix-ui/react-icons';
import Link from 'next/link';
import NavTitle from './navTitle';

export default function NavWrapper() {
  // primitives
  const StyledMenu = styled(NavigationMenuPrimitive.Root, {
    position: `relative`,
    display: `flex`,
    justifyContent: `center`,
    width: `100%`,
    zIndex: 10,
    margin: `0 0 24px`,
  });

  const StyledList = styled(NavigationMenuPrimitive.List, {
    all: `unset`,
    display: `flex`,
    justifyContent: `center`,
    padding: 4,
    listStyle: `none`,
    $$shadowColor: `$colors$primary`,
    boxShadow: `0 0 0 1px $$shadowColor`,
    backdropFilter: `blur(50px) saturate(382%)`,
    '&:hover': {
      boxShadow: `0 0 0 2px $$shadowColor`,
    },
  });

  const itemStyles = {
    padding: `8px 12px`,
    outline: `none`,
    userSelect: `none`,
    fontWeight: 500,
    lineHeight: 1,
    fontSize: 15,
    color: `$colors$primary`,
    $$shadowColor: `$colors$primary`,
    '&:focus': { position: `relative`, background: `$colors$secondary` },
    '&:hover': {
      background: `$colors$faded`,
    },
  };

  const StyledTrigger = styled(NavigationMenuPrimitive.Trigger, {
    all: `unset`,
    ...itemStyles,
    display: `flex`,
    alignItems: `center`,
    justifyContent: `space-between`,
    gap: 2,
  });

  const StyledCaret = styled(CaretDownIcon, {
    position: `relative`,
    top: 1,
    '[data-state=open] &': { transform: `rotate(-180deg)` },
    '@media (prefers-reduced-motion: no-preference)': {
      transition: `transform 250ms ease`,
    },
  });

  const StyledLink = styled(`a`, {
    ...itemStyles,
    display: `block`,
    textDecoration: `none`,
    lineHeight: 1,
  });

  const StyledContent = styled(NavigationMenuPrimitive.Content, {
    position: `absolute`,
    top: 0,
    left: 0,
    width: `100%`,
    backdropFilter: `blur(50px) saturate(382%)`,
  });

  const StyledViewport = styled(NavigationMenuPrimitive.Viewport, {
    position: `relative`,
    transformOrigin: `top center`,
    marginTop: 10,
    width: `100%`,
    overflow: `hidden`,
    height: `var(--radix-navigation-menu-viewport-height)`,
    // width: `var(--radix-navigation-menu-viewport-width)`,
    $$shadowColor: `$colors$primary`,
    boxShadow: `0 0 0 2px $$shadowColor`,
  });

  const ListItem = styled(`li`);

  const LinkTitle = styled(`p`, {
    fontWeight: `Bold`,
    lineHeight: 1.2,
    margin: `0 0 8px`,
    fontSize: `15px`,
    wordWrap: `break-word`,
  });

  const LinkText = styled(`p`, {
    fontSize: `12px`,
    lineHeight: 1.4,
  });

  // Your app...
  const ContentList = styled(`ul`, {
    display: `grid`,
    padding: 22,
    margin: 0,
    columnGap: 10,
    listStyle: `none`,
    width: 600,
    gridAutoFlow: `column`,
    gridTemplateRows: `repeat(3, 1fr)`,
  });

  const ViewportPosition = styled(`div`, {
    position: `absolute`,
    display: `flex`,
    justifyContent: `center`,
    width: `100%`,
    top: `100%`,
    left: 0,
    perspective: `2000px`,
  });

  const GalleryData = NavQuery({ type: `Gallery`, limit: 9 });

  const BlogData = NavQuery({ type: `Blog`, limit: 9 });

  return (
    <>
      <NavTitle />

      <StyledMenu>
        <StyledList>
          {/* home */}
          <NavigationMenuPrimitive.Item>
            <Link href="/" passHref>
              <StyledLink>
                <a>
                  <HomeIcon />
                </a>
              </StyledLink>
            </Link>
          </NavigationMenuPrimitive.Item>

          {/* galleries */}
          <NavigationMenuPrimitive.Item>
            <StyledTrigger>
              <CameraIcon />
              <StyledCaret aria-hidden />
            </StyledTrigger>
            <StyledContent>
              <ContentList>
                {GalleryData &&
                  GalleryData.map((page: any, index: number) => (
                    <ListItem key={index}>
                      <Link href={`/${page.slug}`} passHref>
                        <StyledLink>
                          <LinkTitle>{page.title}</LinkTitle>
                          <LinkText>
                            Published:{` `}
                            {new Date(
                              page.publishDate
                                .replace(/-/g, `/`)
                                .replace(/T.+/, ``),
                            ).toLocaleDateString(`en-us`)}
                          </LinkText>
                        </StyledLink>
                      </Link>
                    </ListItem>
                  ))}
                <ListItem>
                  <Link href="/work" passHref>
                    <StyledLink>
                      {` `}
                      <ArrowRightIcon />
                    </StyledLink>
                  </Link>
                </ListItem>
              </ContentList>
            </StyledContent>
          </NavigationMenuPrimitive.Item>

          {/* blog */}
          <NavigationMenuPrimitive.Item>
            <StyledTrigger>
              <FileTextIcon />
              <StyledCaret aria-hidden />
            </StyledTrigger>
            <StyledContent>
              <ContentList>
                {BlogData &&
                  BlogData.map((page: any, index: number) => (
                    <ListItem key={index}>
                      <Link href={`/${page.slug}`} passHref>
                        <StyledLink>
                          <LinkTitle>{page.title}</LinkTitle>
                          <LinkText>
                            Published:{` `}
                            {new Date(
                              page.publishDate
                                .replace(/-/g, `/`)
                                .replace(/T.+/, ``),
                            ).toLocaleDateString(`en-us`)}
                          </LinkText>
                        </StyledLink>
                      </Link>
                    </ListItem>
                  ))}

                <ListItem>
                  <Link href="/blog" passHref>
                    <StyledLink>
                      <ArrowRightIcon />
                    </StyledLink>
                  </Link>
                </ListItem>
              </ContentList>
            </StyledContent>
          </NavigationMenuPrimitive.Item>

          {/* goodies */}
          <NavigationMenuPrimitive.Item>
            <StyledTrigger>
              <MixIcon />
              <StyledCaret aria-hidden />
            </StyledTrigger>
            <StyledContent>
              <ContentList>
                {/* thoughts */}
                <NavigationMenuPrimitive.Item>
                  <Link href="/thoughts" passHref>
                    <StyledLink>
                      <LinkTitle>Thoughts</LinkTitle>
                      <LinkText>Tiny bits of short form content</LinkText>
                    </StyledLink>
                  </Link>
                </NavigationMenuPrimitive.Item>

                {/* guestbook */}

                <NavigationMenuPrimitive.Item>
                  <Link href="/guestbook" passHref>
                    <StyledLink>
                      <LinkTitle>The Guestbook</LinkTitle>
                      <LinkText>gm, wagmi, lfg</LinkText>
                    </StyledLink>
                  </Link>
                </NavigationMenuPrimitive.Item>
              </ContentList>
            </StyledContent>
          </NavigationMenuPrimitive.Item>

          {/* color mode */}
          <NavigationMenuPrimitive.Item>
            <StyledLink>
              <ThemeToggle />
            </StyledLink>
          </NavigationMenuPrimitive.Item>
        </StyledList>

        <ViewportPosition>
          <StyledViewport />
        </ViewportPosition>
      </StyledMenu>
    </>
  );
}
