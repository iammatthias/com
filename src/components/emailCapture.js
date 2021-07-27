/** @jsx jsx */
import { jsx, Box, Label, Input, Button } from 'theme-ui';
import React, { useState } from 'react'; //eslint-disable-line
import styled from '@emotion/styled';
import { useLocation } from '@reach/router';
import { useForm } from 'react-hook-form';
import { identify, track } from '../hooks/use-segment';

export default function EmailCapture() {
  const [open, setOpen] = useState(false);

  const { register, handleSubmit } = useForm();

  const { pathname } = useLocation();

  const onSubmit = (data, e) => {
    identify({ email: data.email, firstName: data.firstName });
    track('Subscribed', {
      location: pathname,
    });
    setOpen(true);
    e.target.reset();
  };

  const Modal = styled.div`
    content: '';
    border-radius: 4px;
    transition: all 0.3s;
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    top: 0;
    height: 100%;
    width: 100%;
    z-index: 2;
    opacity: ${(props) => (props.open ? '1' : '0')};
    visibility: ${(props) => (props.open ? 'visible' : 'hidden')};
  `;

  return (
    <Box
      sx={{
        position: 'relative',
        p: ['.5rem', '2rem'],
        bg: 'background',
        height: 'fit-content',
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateRows: ['auto 1fr', 'auto 1fr', 'auto 1fr', '1fr'],
          gridTemplateColumns: ['1fr', '1fr', '1fr', '1fr 1fr'],
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
          <h4 sx={{ m: 0, mb: 3, p: 0 }}>The Newsletter</h4>
          <p sx={{ m: 0, mb: 3, p: 0 }}>Sign up for the occaisional update.</p>
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
              bg: 'background',
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
            mb={3}
          />
          <Label
            htmlFor="email"
            sx={{
              fontWeight: 'bold',
              width: 'fit-content',
              ml: '.5rem',
              mb: '-.75rem',
              px: '.5rem',
              bg: 'background',
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
            mb={3}
          />
          <Button type="submit">Submit</Button>
        </form>
      </Box>
      <Modal open={open} sx={{ bg: 'background' }}>
        <Box
          sx={{
            p: ['.5rem'],
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <h4 sx={{ m: 0, mb: 3, p: 0 }}>Thanks for subscribing! </h4>
          <p sx={{ m: 0, mb: 3, p: 0 }}>See you in your inbox sometime soon.</p>
          <Button onClick={() => setOpen(false)} sx={{ width: 'fit-content' }}>
            Close
          </Button>
        </Box>
      </Modal>
    </Box>
  );
}
