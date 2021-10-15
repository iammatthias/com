/** @jsxImportSource theme-ui */
import { Box, Label, Input, Button } from 'theme-ui'
import { useState } from 'react' //eslint-disable-line
import styled from '@emotion/styled'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/router'

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

  const Modal = styled.div`
    opacity: ${props => (props.open ? '1' : '0')};
    visibility: ${props => (props.open ? 'visible' : 'hidden')};
  `
  return (
    <Box
      sx={{
        position: 'relative',
        p: [3, 3, 4],
        bg: 'elevated',
        height: 'fit-content',
        borderRadius: '4px',
        boxShadow: 'card',
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateRows: ['auto 1fr'],
          gridTemplateColumns: ['1fr'],
          gridGap: '1rem',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <h5 sx={{ m: 0, mb: 2, p: 0 }}>The Newsletter</h5>
          <p sx={{ m: 0, p: 0 }}>Sign up for the occaisional update.</p>
        </Box>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Label
            htmlFor="firstName"
            sx={{
              fontWeight: 'bold',
              width: 'fit-content',
              ml: '.5rem',
              mb: '-.75rem',
              px: '.5rem',
              bg: 'elevated',
              zIndex: '1',
              position: 'relative',
            }}
          >
            first name
          </Label>
          <Input
            type="firstName"
            name="first name"
            id="firstName"
            {...register('firstName')}
            mb={2}
          />
          <Label
            htmlFor="email"
            sx={{
              fontWeight: 'bold',
              width: 'fit-content',
              ml: '.5rem',
              mb: '-.75rem',
              px: '.5rem',
              bg: 'elevated',
              zIndex: '1',
              position: 'relative',
            }}
          >
            email
          </Label>
          <Input
            type="email"
            name="email"
            id="email"
            {...register('email')}
            mb={2}
          />
          <Button type="submit">Submit</Button>
        </form>
      </Box>
      <Modal
        open={open}
        sx={{
          content: '""',
          bg: 'elevated',
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
          p: ['.5rem'],
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <h4 sx={{ m: 0, mb: 2, p: 0 }}>Thanks for subscribing! </h4>
        <p sx={{ m: 0, mb: 2, p: 0 }}>See you in your inbox sometime soon.</p>
        <Button onClick={() => setOpen(false)} sx={{ width: 'fit-content' }}>
          Close
        </Button>
      </Modal>
    </Box>
  )
}
