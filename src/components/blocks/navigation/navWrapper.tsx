import { styled } from '@/styles/stitches.config';

import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu';
import NavQuery from './navQuery';
import ThemeToggle from '@/components/joy/themeToggle';
import Grid from '@/components/primitives/grid';
import {
  CaretDownIcon,
  HomeIcon,
  CameraIcon,
  FileTextIcon,
  FaceIcon,
  ArrowRightIcon,
} from '@radix-ui/react-icons';
import Link from 'next/link';
import { Box } from '@/components/primitives/box';
import { Text } from '@/components/primitives/text';
import Sparkle from '@/components/joy/sparkle';

export default function NavWrapper() {
  // primitives
  const StyledMenu = styled(NavigationMenuPrimitive.Root, {
    position: `relative`,
    display: `flex`,
    justifyContent: `center`,
    zIndex: 89,
  });

  const StyledList = styled(NavigationMenuPrimitive.List, {
    display: `flex`,
    justifyContent: `center`,
    verticalAlign: `middle`,
    marginLeft: 0,
    padding: 4,
    listStyle: `none`,
    $$shadowColor: `$colors$primary`,
    boxShadow: `0 0 0 1px $$shadowColor`,
    backdropFilter: `blur(50px) saturate(618%)`,
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
    ...itemStyles,
    display: `flex`,
    alignItems: `center`,
    justifyContent: `space-between`,
    gap: 2,
    border: `0`,
    background: `none`,
    margin: 0,
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
    fontSize: 15,
    lineHeight: `0`,
  });

  const StyledContent = styled(NavigationMenuPrimitive.Content, {
    position: `absolute`,
    top: 0,
    left: 0,
    width: `100%`,

    backdropFilter: `blur(50px) saturate(618%)`,

    // background: `$colors$background`,
  });

  const StyledViewport = styled(NavigationMenuPrimitive.Viewport, {
    position: `relative`,
    marginTop: 10,
    marginBottom: 50,
    width: `100%`,

    overflow: `hidden`,
    height: `var(--radix-navigation-menu-viewport-height)`,
    $$shadowColor: `$colors$primary`,
    boxShadow: `0 0 0 2px $$shadowColor`,
  });

  // Exports

  // Your app...
  const ContentList = styled(`div`, {
    position: `relative`,
    width: `calc(100% - 48px)`,
    height: `100%`,
    padding: 24,
    margin: 0,
    display: `grid`,
    gridTemplateColumns: `1fr`,
    gridTemplateRows: `auto`,
    gridGap: `1rem`,
    '@bp1': {
      gridTemplateColumns: `1fr 1fr`,
    },
    '@bp2': {
      gridTemplateColumns: `1fr 1fr 1fr`,
    },
  });

  const ViewportPosition = styled(`div`, {
    position: `absolute`,
    display: `flex`,
    width: `100%`,
    top: `100%`,
    left: 0,
  });

  return (
    <Grid>
      <Box
        css={{
          textAlign: `center`,
          lineHeight: `1`,
        }}
      >
        <Text as="h4">I am</Text>

        <Text as="h1">
          <Sparkle>Matthias</Sparkle>
        </Text>
      </Box>
      <StyledMenu>
        <StyledList>
          <NavigationMenuPrimitive.Item>
            <Link href="/" passHref>
              <StyledLink>
                <HomeIcon />
              </StyledLink>
            </Link>
          </NavigationMenuPrimitive.Item>

          <NavigationMenuPrimitive.Item>
            <StyledTrigger>
              <CameraIcon />
              <StyledCaret aria-hidden />
            </StyledTrigger>
            <StyledContent>
              <ContentList>
                <NavQuery type="Gallery" limit="9" />
                <Link href="/work" passHref>
                  <ArrowRightIcon />
                </Link>
              </ContentList>
            </StyledContent>
          </NavigationMenuPrimitive.Item>

          <NavigationMenuPrimitive.Item>
            <StyledTrigger>
              <FileTextIcon />
              <StyledCaret aria-hidden />
            </StyledTrigger>
            <StyledContent>
              <ContentList>
                <NavQuery type="Blog" limit="9" />

                <Link href="/blog" passHref>
                  <ArrowRightIcon />
                </Link>
              </ContentList>
            </StyledContent>
          </NavigationMenuPrimitive.Item>

          <NavigationMenuPrimitive.Item>
            <Link href="/guestbook" passHref>
              <StyledLink>
                <FaceIcon />
              </StyledLink>
            </Link>
          </NavigationMenuPrimitive.Item>

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
    </Grid>
  );
}
