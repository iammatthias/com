/** @jsx jsx */

import React, { useEffect } from 'react' //eslint-disable-line
import { jsx, Styled, Flex } from 'theme-ui'
import styled from '@emotion/styled'
import PropTypes from 'prop-types'

const Modal = styled.div`
  content: '';
  transition: all 0.3s;
  z-index: 2;
  background: var(--theme-ui-colors-secondary);
  color: inherit;
  opacity: ${props => (props.visible ? '1' : '0')};
  visibility: ${props => (props.visible ? 'visible' : 'hidden')};
  section {
    p {
      line-height: 1.6;
      margin: 0 0 2em 0;
      text-align: center;
    }
  }
`

const Form = styled.form`
  width: 100%;
  padding: 16px;
  label {
    padding: 0 16px;
  }
  input {
    padding: 16px;

    color: ${props => props.theme.colors.text};
    background: ${props => props.theme.colors.secondary};
    &::placeholder {
      color: ${props => props.theme.colors.shadow};
    }
    &:last-child {
      color: ${props => props.theme.colors.text};
      background: ${props => props.theme.colors.shadow};
    }
  }

  &::invalid {
    box-shadow: none;
  }
  &::required {
    box-shadow: none;
  }
  &::optional {
    box-shadow: none;
  }
  @media screen and (min-width: ${props => props.theme.responsive.medium}) {
    width: 60%;
  }
`

const Email = styled.input`
  margin: 0 0 16px;
  width: 100%;
`
const Name = styled.input`
  margin: 0 0 16px;
  width: 100%;
`

const Submit = styled.input`
  cursor: pointer;
  transition: 0.2s;
  width: 100%;
  font-weight: bold;
`

class EmailCapture extends React.Component {
  constructor(props, title) {
    super(props)
    this.state = {
      name: '',
      email: '',
      message: '',
      showModal: false,
      showPrompt: true,
    }
  }

  handleInputChange = event => {
    const target = event.target
    const value = target.value
    const email = target.email
    const name = target.name
    this.setState({
      [email]: value,
      [name]: value,
    })
  }

  componentDidMount() {
    this.handleSubmit = event => {
      event.preventDefault()
      this.handleSuccess()
      window.analytics.identify({
        email: this.state.email,
        name: this.state.name,
      })
    }
  }

  handleSuccess = () => {
    this.setState({
      email: '',
      name: '',
      showModal: true,
      showPrompt: false,
    })
  }

  closeModal = () => {
    this.setState({ showModal: false, showPrompt: true })
  }

  render(props) {
    return (
      <Flex
        sx={{
          border: '1px solid',
          borderColor: 'inherit',
          alignItems: 'center',
          mb: 3,
          flexWrap: ['wrap', 'nowrap'],
        }}
      >
        <div sx={{ p: 3, position: 'relative' }}>
          <Styled.h3>Want to see more?</Styled.h3>
          <Styled.p>Sign up to find out when there is an update.</Styled.p>
          <Styled.p>
            Gallery releases, blog posts, and maybe even the occasional recipe.
          </Styled.p>
          <Styled.p sx={{ fontSize: 0 }}>
            <i>
              <b>Privacy:</b> I will never sell or share your personal
              information.
              <br />
              Unsubscribe at any time.
            </i>
          </Styled.p>
          <Modal visible={this.state.showModal}>
            <h4>Thanks for subscribing! </h4>
            <p>See you in your inbox sometime soon.</p>
          </Modal>
        </div>
        <Form
          name="subscribe"
          onSubmit={this.handleSubmit}
          overlay={this.state.visible}
          onClick={this.closeModal}
        >
          <Name
            name="name"
            type="name"
            placeholder="Name"
            value={this.state.name}
            onChange={this.handleInputChange}
            required
          />
          <Email
            name="email"
            type="email"
            placeholder="Email"
            value={this.state.email}
            onChange={this.handleInputChange}
            required
          />

          <Submit className="button" name="submit" type="submit" value="Send" />
        </Form>
      </Flex>
    )
  }
}

EmailCapture.propTypes = {
  data: PropTypes.object,
}

export default EmailCapture
