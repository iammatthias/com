/** @jsx jsx */

import React from 'react' //eslint-disable-line

import { jsx } from 'theme-ui'

import FitText from '@kennethormandy/react-fittext'

import SEO from '../components/SEO'
import { Wrapper, Content } from '../utils/Styled'

const NotFoundPage = () => (
  <>
    <SEO title="404" />
    <Wrapper>
      <Content className="lost">
        <FitText compressor={0.2}>
          <p
            sx={{
              variant: 'styles.h1',
            }}
            className="knockout"
          >
            404
          </p>
        </FitText>
      </Content>
    </Wrapper>
  </>
)

export default NotFoundPage
