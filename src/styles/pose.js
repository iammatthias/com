const transitionDuration = 400
const transitionDelay = 350

export const pageFade = {
  initial: {
    opacity: 0,
  },
  enter: {
    opacity: 1,
    transition: { duration: transitionDuration },
    delay: transitionDelay,
    beforeChildren: true,
  },
  exit: {
    opacity: 0,
    transition: { duration: transitionDuration },
  },
}
