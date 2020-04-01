/** @jsx jsx */

import React, { useEffect } from 'react' //eslint-disable-line
import { jsx, Styled } from 'theme-ui'
import styled from '@emotion/styled'
import PropTypes from 'prop-types'

const Modal = styled.div`
  position: absolute;
  top: 0;
  content: '';
  transition: all 0.3s;
  z-index: 2;
  background: black;
  width: 100%;
  height: 100%;
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
  position: relative;
  width: 100%;
  label {
    padding: 0 16px;
  }
  input,
  textarea {
    padding: 12px;
    color: black;
    background: white;
    -webkit-appearance: none;
    border-radius: 0;
    &::placeholder {
      color: ${props => props.theme.colors.shadow};
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
`

const Input = styled.input`
  margin: 0 0 8px;
  width: 100%;
`
const TextArea = styled.textarea`
  margin: 0 0 8px;
  width: 100%;
`

const Submit = styled.input`
  cursor: pointer;
  transition: 0.2s;
  width: 100%;
  font-weight: bold;
  padding: 12px;
  color: white !important;
  background: black !important;
  border: 1px solid white;
`

const encode = data => {
  return Object.keys(data)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    .join('&')
}

class CovidForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      name: '',
      email: '',
      restaurant: '',
      address: '',
      notes: '',
      showModal: false,
      showPrompt: true,
    }
  }

  handleInputChange = event => {
    const target = event.target
    const value = target.value
    const email = target.email
    const name = target.name
    const restaurant = target.restaurant
    const address = target.address
    const notes = target.notes
    this.setState({
      [email]: value,
      [name]: value,
      [restaurant]: value,
      [address]: value,
      [notes]: value,
    })
  }

  componentDidMount() {
    this.handleSubmit = event => {
      fetch('/?no-cache=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encode({ 'form-name': 'contact', ...this.state }),
      })
        .then(this.handleSuccess)
        .catch(error => alert(error))
      event.preventDefault()
      this.handleSuccess()
      window.analytics.track('Covid Lander Form Submitted', {})
      window.analytics.identify({
        email: this.state.email,
        name: this.state.name,
        restaurant: this.state.restaurant,
        address: this.state.address,
        notes: this.state.notes,
        tags: [
          {
            name: 'Covid',
          },
        ],
      })
    }
  }

  handleSuccess = () => {
    this.setState({
      email: '',
      name: '',
      restaurant: '',
      address: '',
      notes: '',
      showModal: true,
      showPrompt: false,
    })
  }

  closeModal = () => {
    this.setState({ showModal: false, showPrompt: true })
  }

  render(props) {
    return (
      <>
        <Form
          name="Covid"
          onSubmit={this.handleSubmit}
          overlay={this.state.visible}
          onClick={this.closeModal}
        >
          <Modal visible={this.state.showModal}>
            <hr></hr>
            <Styled.h2 sx={{ fontFamily: 'monospace', color: 'white' }}>
              Thanks for reaching out.
            </Styled.h2>
            <Styled.p sx={{ fontFamily: 'monospace', color: 'white' }}>
              I'll be in touch.
            </Styled.p>
            <Styled.p sx={{ fontFamily: 'monospace', color: 'white' }}>
              Please note: due to demand, I may not be able to help everyone who
              requests assistance. Services will be provided on a case-by-case
              basis.
            </Styled.p>
          </Modal>
          <Styled.p
            sx={{
              fontFamily: 'monospace',
              color: 'white',
              fontSize: '10px',
              textAlign: 'right',
            }}
          >
            * indicates required field
          </Styled.p>
          <Input
            name="name"
            type="name"
            placeholder="Name*"
            value={this.state.name}
            onChange={this.handleInputChange}
            required
          />
          <Input
            name="email"
            type="email"
            placeholder="Email*"
            value={this.state.email}
            onChange={this.handleInputChange}
            required
          />
          <Input
            name="restaurant"
            type="restaurant"
            placeholder="Restaurant*"
            value={this.state.restaurant}
            onChange={this.handleInputChange}
            required
          />
          <Input
            name="address"
            type="address"
            placeholder="Address*"
            value={this.state.address}
            onChange={this.handleInputChange}
            required
          />
          <TextArea
            name="notes"
            type="notes"
            placeholder="Notes - Number of dishes that need to be photographed, interior / exterior shots, preferred time of day, etc."
            value={this.state.notes}
            onChange={this.handleInputChange}
            required
          />
          <Submit
            className="button"
            name="submit"
            type="submit"
            value="Submit"
          />
        </Form>
      </>
    )
  }
}

CovidForm.propTypes = {
  data: PropTypes.object,
}

export default CovidForm
