import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

const Subscribe = styled.div`
  grid-column: 4;
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  align-items: flex-start;
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: var(--shadow);
  border: 2px var(--color-secondary) solid;
`

const Copy = styled.div`
  width: 100%;
  margin-bottom: 1rem;
  h4 {
    margin: 0;
  }
  position: relative;
  @media screen and (min-width: 52rem) {
    width: 48%;
    margin-bottom: 0;
  }
`

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
  background: var(--color-base);
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
  input {
    outline: none;
    padding: 1rem;
    border: 2px var(--color-secondary) solid;
    background: rgba(var(--grey-800), 0.15);
    color: var(--color-secondary);
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

  @media screen and (min-width: 52rem) {
    width: 48%;
  }
`

const Email = styled.input`
  margin: 0 0 2rem 0;
  width: 100%;
  height: 100%;
  border-radius: 0.5rem 0.5rem 0 0;
  @media screen and (min-width: 52rem) {
    margin: 0;
  }
`

const Submit = styled.input`
  border-radius: 0 0 0.5rem 0.5rem;
  cursor: pointer;
  transition: 0.2s;
  width: 100%;
  font-weight: bold;
  background: var(--color-secondary) !important;
  color: var(--color-base) !important;
  text-shadow: 0.125em 0.125em var(--color-secondary) !important;
  &:hover {
    text-shadow: 0.125em 0.125em var(--color-secondary),
      0.25em 0.25em var(--color-tertiary),
      0.375em 0.375em var(--color-highlight), 0.5em 0.5em var(--color-accent) !important;
  }
`

class ContactForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      name: '',
      email: '',
      message: '',
      showModal: false,
      title: props.title,
    }
  }

  handleInputChange = event => {
    const target = event.target
    const value = target.value
    const email = target.name
    this.setState({
      [email]: value,
    })
  }

  componentDidMount() {
    this.handleSubmit = event => {
      event.preventDefault()
      this.handleSuccess()
      window.analytics.identify('Subscribed', {
        email: this.state.email,
        page: this.props.title,
      })
    }
  }

  handleSuccess = () => {
    this.setState({
      email: '',
      showModal: true,
    })
  }

  closeModal = () => {
    this.setState({ showModal: false })
  }

  render() {
    return (
      <Subscribe>
        <Copy>
          <h4>Enjoying the content?</h4>
          <p>
            Sign up to recieve the occaisonal handcrafted newsletter or
            announcement. We promise to never sell or share your email address.
          </p>
          <Modal visible={this.state.showModal}>
            <h4>Thanks for subscribing! </h4>
            <p>See you in your inbox sometime soon.</p>
          </Modal>
        </Copy>
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
          <Submit className="button" name="submit" type="submit" value="Send" />
        </Form>
      </Subscribe>
    )
  }
}

ContactForm.propTypes = {
  data: PropTypes.object,
}

export default ContactForm
