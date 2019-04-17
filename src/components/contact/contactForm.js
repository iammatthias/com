import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import 'whatwg-fetch'
import { Link as Button } from 'rebass'

const Form = styled.form`
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  align-items: flex-start;
  input,
  textarea {
    font-family: inherit;
    font-size: inherit;
    outline: none;
    padding: 1rem;
    border: 2px var(--color-secondary) solid;
    background: var(--color-base);
    color: var(--color-secondary);
  }
  &::before {
    content: '';
    height: 100%;
    width: 100%;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1;
    transition: 0.2s all;
    opacity: ${props => (props.overlay ? '.8' : '0')};
    visibility: ${props => (props.overlay ? 'visible' : 'hidden')};
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
`

const Name = styled.input`
  margin: 0 0 2rem 0;
  width: 100%;
  @media (min-width: 40em) {
    width: 48%;
  }
`

const Email = styled.input`
  margin: 0 0 2rem 0;
  width: 100%;
  @media (min-width: 40em) {
    width: 48%;
  }
`

const Message = styled.textarea`
  width: 100%;
  margin: 0 0 2rem 0;
  line-height: 1.6;
  min-height: 250px;
  resize: vertical;
`

const Submit = styled.input`
  cursor: pointer;
  transition: 0.2s;
  width: 100%;
  font-size: 1.25em !important;
  background: var(--color-secondary) !important;
  color: var(--color-base) !important;
  text-shadow: 0.125em 0.125em var(--color-secondary) !important;
  &:hover {
    text-shadow: 0.125em 0.125em var(--color-secondary),
      0.25em 0.25em var(--color-tertiary),
      0.375em 0.375em var(--color-highlight), 0.5em 0.5em var(--color-accent) !important;
  }
`

const Modal = styled.div`
  background: white;
  padding: 2em;
  border-radius: 2px;
  width: 50%;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 99;
  display: flex;
  flex-flow: column;
  align-items: center;
  text-align: center;
  transition: 0.2s all;
  opacity: ${props => (props.visible ? '1' : '0')};
  visibility: ${props => (props.visible ? 'visible' : 'hidden')};
  p {
    line-height: 1.6;
    margin: 0 0 2em 0;
  }
`

const encode = data => {
  return Object.keys(data)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    .join('&')
}

class ContactForm extends React.Component {
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
    const name = target.name
    this.setState({
      [name]: value,
    })
  }

  handleSubmit = event => {
    fetch('/contact/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encode({ 'form-name': 'contact', ...this.state }),
    })
      .then(this.handleSuccess)
      .catch(error => alert(error))
    event.preventDefault()
  }

  handleSuccess = () => {
    this.setState({
      name: '',
      email: '',
      message: '',
      showModal: true,
    })
  }

  closeModal = () => {
    this.setState({ showModal: false })
  }

  render() {
    return (
      <Form
        name="contact"
        onSubmit={this.handleSubmit}
        data-netlify="true"
        data-netlify-honeypot="bot"
        overlay={this.state.showModal}
        onClick={this.closeModal}
      >
        <input type="hidden" name="form-name" value="contact" />
        <p hidden>
          <label>
            Don’t fill this out:{' '}
            <input name="bot" onChange={this.handleInputChange} />
          </label>
        </p>

        <Name
          name="name"
          type="text"
          placeholder="Full Name"
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
        <Message
          name="message"
          type="text"
          placeholder="Message"
          value={this.state.message}
          onChange={this.handleInputChange}
          required
        />
        <Submit className="button" name="submit" type="submit" value="Send" />

        <Modal visible={this.state.showModal}>
          <p>
            Thank you for reaching out. I will get back to you as soon as
            possible.
          </p>
          <Button className="button" color="" onClick={this.closeModal}>
            Okay
          </Button>
        </Modal>
      </Form>
    )
  }
}

ContactForm.propTypes = {
  data: PropTypes.object,
}

export default ContactForm
