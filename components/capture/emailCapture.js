/** @jsxImportSource theme-ui */
import { Box, Label, Input, Button } from 'theme-ui'
import { useState } from 'react' //eslint-disable-line
import styled from '@emotion/styled'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/router'
import Sparkle from '../joy/sparkle'

// email

export default function EmailCapture({ props }) {
  const [open, setOpen] = useState(false)

  const { register, handleSubmit } = useForm()

  const router = useRouter()
  const pathname = router.asPath

  const onSubmit = (data, e) => {
    global.analytics.identify({ email: data.email, firstName: data.firstName })
    global.analytics.track('Subscribed', {
      location: pathname,
    })
    setOpen(true)
    e.target.reset()
  }

  const Capture = styled.div`
    opacity: ${props => (props.open ? '0' : '1')};
    visibility: ${props => (props.open ? 'hidden' : 'visible')};
  `
  const Modal = styled.div`
    opacity: ${props => (props.open ? '1' : '0')};
    visibility: ${props => (props.open ? 'visible' : 'hidden')};
  `
  return (
    <Box
      sx={{
        position: 'relative',
        p: [3, 3, 4],
        height: 'fit-content',
        borderRadius: '4px',
        display: 'grid',
        gridTemplateRows: ['auto 1fr'],
        gridTemplateColumns: ['1fr'],
        gridGap: '1rem',
      }}
    >
      <Capture open={open}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <h5 sx={{ m: 0, mb: 2, p: 0 }}>The Newsletter</h5>
          <p sx={{ m: 0, p: 0 }}>Sign up for the occasional update.</p>
        </Box>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Input
            type="firstName"
            name="first name"
            id="firstName"
            placeholder="name"
            {...register('firstName')}
            sx={{ mb: 2, '&::placeholder': { color: 'text' } }}
          />
          <Input
            type="email"
            name="email"
            id="email"
            placeholder="email"
            {...register('email')}
            sx={{ mb: 2, '&::placeholder': { color: 'text' } }}
          />
          <Button type="submit">
            <Sparkle>Submit</Sparkle>
          </Button>
        </form>
      </Capture>
      <Modal
        open={open}
        sx={{
          content: '""',
          borderRadius: '4px',
          transition: 'all 0.3s',
          position: 'absolute',
          left: '0',
          right: '0',
          bottom: '0',
          top: '0',
          height: '100%',
          width: '100%',
          zIndex: '2',
          p: [3, 3, 4],
        }}
      >
        <h4 sx={{ m: 0, mb: 2, p: 0 }}>Thanks for subscribing! </h4>
        <p sx={{ m: 0, mb: 2, p: 0 }}>See you in your inbox sometime soon.</p>
        <Button onClick={() => setOpen(false)} sx={{ width: 'fit-content' }}>
          <Sparkle>Close</Sparkle>
        </Button>
      </Modal>
    </Box>
  )
}
