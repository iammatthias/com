let isDev = false

if (process && process.env.NODE_ENV === 'development') {
  isDev = true
}

export { isDev }
