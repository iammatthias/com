/** @jsx jsx */

import React, { useEffect } from 'react' //eslint-disable-line
import { jsx, Styled, Flex } from 'theme-ui'
import styled from '@emotion/styled'
import PropTypes from 'prop-types'

const Modal = styled.div`
  content: 'butts';
  border-radius: 0.5rem;
  transition: all 0.3s;
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  flex-direction: column;
  z-index: 2;
  background: rgba(var(--base), 1);
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
  margin: 0;
  padding: 16px;
  input {
    padding: 16px;
    border: 1px solid;
    border-color: inherit;
    color: inherit;
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
  constructor(props) {
    super(props)
    this.state = {
      name: '',
      email: '',
      message: '',
      showModal: false,
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
      window.analytics.identify('Subscribed', {
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
    })
  }

  closeModal = () => {
    this.setState({ showModal: false })
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
        <div sx={{ p: 3 }}>
          <Styled.h3>Enjoying the content?</Styled.h3>
          <Styled.p>
            Sign up to find out when there is an update. Gallery releases, blog
            posts, and maybe even the occasional recipe.
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
          <Email
            name="email"
            type="email"
            placeholder="Email"
            value={this.state.email}
            onChange={this.handleInputChange}
            required
          />
          <Name
            name="name"
            type="name"
            placeholder="Name"
            value={this.state.name}
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
