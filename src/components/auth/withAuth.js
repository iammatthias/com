import React, { PureComponent } from 'react'

import auth from './auth'

// We can check this before the component is rendered.
const alreadyLoggedIn = auth.isAuthenticated || auth.currentUser() !== null

export default function withAuth(PageComponent) {
  return class WithAuthPageComponent extends PureComponent {
    state = {
      isLoggedIn: false,
      redirectPath: null,
    }

    componentDidMount() {
      // When it's first mounted, store the path name.
      // This allows us to redirect to it after the user has logged in.
      const path = window.location.pathname
      this.setState({
        redirectPath: !alreadyLoggedIn && path !== '/' ? path : null,
      })
    }

    login = () =>
      auth.authenticate(user => {
        if (user) {
          this.setState({
            isLoggedIn: true,
          })
        }
      })

    render() {
      const { isLoggedIn, redirectPath } = this.state

      if (!isLoggedIn && !alreadyLoggedIn) {
        return (
          <button
            type="button"
            onClick={this.login}
            // This will center the button vertically
            // and horizontally. You don't need to do this necessarily.
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            LOGIN
          </button>
        )
      }

      if (redirectPath) {
        window.location.replace(redirectPath)
        return null
      }

      return <PageComponent {...this.props} />
    }
  }
}
