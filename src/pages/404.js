/** @jsx jsx */

import React from 'react' //eslint-disable-line

import { jsx } from 'theme-ui'

import { Link } from 'gatsby'

import FitText from '@kennethormandy/react-fittext'

import SEO from '../components/SEO'
import { Wrapper, Content } from '../utils/Styled'

const NotFoundPage = () => (
  <>
    <SEO title="404" />
    <Wrapper>
      <Content className="lost">
        <FitText compressor={0.382}>
          <p
            sx={{
              variant: 'styles.h1',
            }}
            className="knockout"
          >
            404
          </p>
          <p
            sx={{
              variant: 'styles.p',
            }}
          >
            You don't have to go{' '}
            <Link
              sx={{
                variant: 'styles.a',
              }}
              href="/"
            >
              home
            </Link>{' '}
            but can't stay here.
          </p>
        </FitText>
      </Content>
    </Wrapper>
  </>
)

export default NotFoundPage
