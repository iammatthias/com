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

export const staggerChildren = {
  enter: { staggerChildren: 50 },
}

export const delayChildren = {
  enter: { delayChildren: transitionDelay },
}

export const slideUp = {
  initial: { y: '110%' },
  enter: { y: 0, transition: { duration: transitionDuration } },
}

export const appear = {
  initial: { opacity: 0, y: 10 },
  enter: {
    opacity: 1,
    y: 0,
    transition: { duration: transitionDuration },
  },
}

export const fade = {
  initial: { opacity: 0 },
  enter: {
    opacity: 1,
    transition: { duration: transitionDuration },
  },
}
