/** @jsx jsx */

import React from 'react'; //eslint-disable-line
import { jsx, Box } from 'theme-ui';
import { lighten } from '@theme-ui/color';
// import moment from 'moment';
import { useMoralisCloudFunction } from 'react-moralis';
import Link from './link';

export default function GuestbookList() {
  const { data } = useMoralisCloudFunction('getUserList');
  console.log(data);

  const GuestList = data.map((guest) => {
    // let signedAt = moment(guest.updatedAt).format('MM/DD/YYYY [at] h:mm:ss a');
    let signedAt = new Date(guest.updatedAt).toLocaleDateString('en-gb');
    let address = guest.ethAddress;
    return (
      <Box
        key={address}
        sx={{
          bg: lighten('background', 0.025),
          my: '1rem',
          width: ['calc(100vw - 4rem)', '50%'],
          p: '.5rem',
          borderRadius: '4px',
        }}
      >
        <small
          sx={{ m: 0, p: '0 0 1rem', fontWeight: 'bold', fontFamily: 'mono' }}
        >
          {signedAt}
        </small>
        <p
          sx={{
            m: 0,
            p: '0',
            overflow: 'scroll',
            textOverflow: 'clip ellipsis',
            fontFamily: 'mono',
          }}
        >
          <Link
            href={'https://etherscan.io/address/' + address}
            sx={{ fontWeight: 'normal', textDecoration: 'none' }}
          >
            {address}
          </Link>
        </p>
      </Box>
    );
  });

  return <>{GuestList}</>;
}
