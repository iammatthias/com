import { forwardRef } from 'react'

import { styled, keyframes } from '@/lib/stitches.config'
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu'
import Box from '../primitives/box'
import Grid from '../primitives/grid'
import NavigationQuery from './navigationQuery'
import {
  CaretDownIcon,
  HomeIcon,
  CameraIcon,
  FileTextIcon,
  FaceIcon,
} from '@radix-ui/react-icons'
import ColorToggle from '../colorToggle'

export default function Nav() {
  // keyframes
  const enterFromRight = keyframes({
    from: { transform: 'translateX(200px)', opacity: 0 },
    to: { transform: 'translateX(0)', opacity: 1 },
  })

  const enterFromLeft = keyframes({
    from: { transform: 'translateX(-200px)', opacity: 0 },
    to: { transform: 'translateX(0)', opacity: 1 },
  })

  const exitToRight = keyframes({
    from: { transform: 'translateX(0)', opacity: 1 },
    to: { transform: 'translateX(200px)', opacity: 0 },
  })

  const exitToLeft = keyframes({
    from: { transform: 'translateX(0)', opacity: 1 },
    to: { transform: 'translateX(-200px)', opacity: 0 },
  })

  const scaleIn = keyframes({
    from: { transform: 'rotateX(-30deg) scale(0.9)', opacity: 0 },
    to: { transform: 'rotateX(0deg) scale(1)', opacity: 1 },
  })

  const scaleOut = keyframes({
    from: { transform: 'rotateX(0deg) scale(1)', opacity: 1 },
    to: { transform: 'rotateX(-10deg) scale(0.95)', opacity: 0 },
  })

  const fadeIn = keyframes({
    from: { opacity: 0 },
    to: { opacity: 1 },
  })

  const fadeOut = keyframes({
    from: { opacity: 1 },
    to: { opacity: 0 },
  })

  // primitives
  const StyledMenu = styled(NavigationMenuPrimitive.Root, {
    position: 'relative',
    display: 'flex',
    justifyContent: 'start',
    zIndex: 100,
  })

  const StyledList = styled(NavigationMenuPrimitive.List, {
    display: 'flex',
    justifyContent: 'center',
    verticalAlign: 'middle',
    padding: 4,
    borderRadius: 6,
    listStyle: 'none',
    $$shadowColor: '$colors$slate12',
    boxShadow: `0 0 0 1px $$shadowColor`,
    backdropFilter: 'opacity(38.2%) saturate(1618%) blur(50px)',
    '&:hover': {
      boxShadow: `0 0 0 2px $$shadowColor`,
      animation: `${fadeIn} 328ms ease-out`,
    },
  })

  const itemStyles = {
    padding: '8px 12px',
    outline: 'none',
    userSelect: 'none',
    fontWeight: 500,
    lineHeight: 1,
    borderRadius: 4,
    fontSize: 15,
    color: '$colors$slate12',
    $$shadowColor: '$colors$slate12',
    '&:focus': { position: 'relative', boxShadow: `0 0 0 1px $$shadowColor` },
  }

  const StyledTrigger = styled(NavigationMenuPrimitive.Trigger, {
    ...itemStyles,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 2,
    border: '0',
    background: 'none',
  })

  const StyledCaret = styled(CaretDownIcon, {
    position: 'relative',
    top: 1,
    '[data-state=open] &': { transform: 'rotate(-180deg)' },
    '@media (prefers-reduced-motion: no-preference)': {
      transition: 'transform 250ms ease',
    },
  })

  const StyledTriggerWithCaret = forwardRef(
    ({ children, ...props }: any, forwardedRef) => (
      <StyledTrigger {...props} ref={forwardedRef}>
        {children}
        <StyledCaret aria-hidden />
      </StyledTrigger>
    ),
  )

  const StyledLink = styled(NavigationMenuPrimitive.Link, {
    ...itemStyles,
    display: 'block',
    textDecoration: 'none',
    fontSize: 15,
    lineHeight: 1,
  })

  const StyledContent = styled(NavigationMenuPrimitive.Content, {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    borderRadius: 6,
    backdropFilter: 'opacity(38.2%) saturate(1618%) blur(50px)',

    '@media (prefers-reduced-motion: no-preference)': {
      animationDuration: '250ms',
      animationTimingFunction: 'ease',
      '&[data-motion="from-start"]': { animationName: enterFromLeft },
      '&[data-motion="from-end"]': { animationName: enterFromRight },
      '&[data-motion="to-start"]': { animationName: exitToLeft },
      '&[data-motion="to-end"]': { animationName: exitToRight },
    },
  })

  const StyledIndicator = styled(NavigationMenuPrimitive.Indicator, {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 10,
    top: '100%',
    overflow: 'hidden',
    zIndex: 1,
    '@media (prefers-reduced-motion: no-preference)': {
      transition: 'width, transform 250ms ease',
      '&[data-state="visible"]': { animation: `${fadeIn} 200ms ease` },
      '&[data-state="hidden"]': { animation: `${fadeOut} 200ms ease` },
    },
  })

  const StyledArrow = styled('div', {
    position: 'relative',
    top: '70%',
    // backgroundColor: 'white',
    borderRadius: 6,
    backdropFilter: 'opacity(38.2%) saturate(1618%) blur(50px)',
    width: 10,
    height: 10,
    transform: 'rotate(45deg)',
    borderTopLeftRadius: 2,
    $$shadowColor: '$colors$slate12',
    boxShadow: `0 0 0 2px $$shadowColor`,
  })

  const StyledIndicatorWithArrow = forwardRef((props: any, forwardedRef) => (
    <StyledIndicator {...props} ref={forwardedRef}>
      <StyledArrow />
    </StyledIndicator>
  ))

  const StyledViewport = styled(NavigationMenuPrimitive.Viewport, {
    position: 'relative',
    marginTop: 10,
    width: '100%',
    borderRadius: 6,
    overflow: 'hidden',
    $$shadowColor: '$colors$slate12',
    boxShadow: `0 0 0 2px $$shadowColor`,
    height: 'var(--radix-navigation-menu-viewport-height)',
    '@media (prefers-reduced-motion: no-preference)': {
      transition: 'width, height, 300ms ease',
      '&[data-state="open"]': { animation: `${scaleIn} 200ms ease` },
      '&[data-state="closed"]': { animation: `${scaleOut} 200ms ease` },
    },
  })

  // Exports

  // Your app...
  const ContentList = styled('div', {
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    padding: 16,
    margin: 0,
    display: 'grid',
    gridTemplateColumns: '1fr',
    gridTemplateRows: 'auto',
    gridGap: '1rem',
    '@bp1': {
      gridTemplateColumns: '1fr 1fr',
    },
    '@bp2': {
      gridTemplateColumns: '1fr 1fr 1fr',
    },
  })

  const ViewportPosition = styled('div', {
    position: 'absolute',
    display: 'flex',
    width: '100%',
    top: '100%',
    left: 0,
  })

  return (
    <Grid>
      <StyledMenu>
        <StyledList>
          <NavigationMenuPrimitive.Item>
            <StyledLink href="/">
              <HomeIcon />
            </StyledLink>
          </NavigationMenuPrimitive.Item>

          <NavigationMenuPrimitive.Item>
            <StyledTriggerWithCaret>
              <CameraIcon />
            </StyledTriggerWithCaret>
            <StyledContent>
              <ContentList>
                <NavigationQuery type="Gallery" />
              </ContentList>
            </StyledContent>
          </NavigationMenuPrimitive.Item>

          <NavigationMenuPrimitive.Item>
            <StyledTriggerWithCaret>
              <FileTextIcon />
            </StyledTriggerWithCaret>
            <StyledContent>
              <ContentList>
                <NavigationQuery type="Blog" />
              </ContentList>
            </StyledContent>
          </NavigationMenuPrimitive.Item>

          <NavigationMenuPrimitive.Item>
            <StyledLink href="/guestbook">
              <FaceIcon />
            </StyledLink>
          </NavigationMenuPrimitive.Item>

          <NavigationMenuPrimitive.Item>
            <ColorToggle />
          </NavigationMenuPrimitive.Item>

          <StyledIndicatorWithArrow />
        </StyledList>

        <ViewportPosition>
          <StyledViewport />
        </ViewportPosition>
      </StyledMenu>
    </Grid>
  )
}
