import netlifyIdentity from 'netlify-identity-widget'

// `window` won't be defined on SSR builds
if (typeof window !== 'undefined') {
  netlifyIdentity.init()
  window.netlifyIdentity = netlifyIdentity
}

export default {
  isAuthenticated: false,
  authenticate(callback) {
    this.isAuthenticated = true
    netlifyIdentity.open()
    netlifyIdentity.on('login', user => callback(user))
  },
  currentUser() {
    return netlifyIdentity.currentUser()
  },
}
