/** @jsx jsx */

import React from 'react'; //eslint-disable-line
import { jsx } from 'theme-ui';
import moment from 'moment';
import { useMoralisCloudFunction } from 'react-moralis';

export default function GuestbookList() {
  const { data } = useMoralisCloudFunction('getUserList', {});
  console.log(data);

  const GuestList = data.map((guest) => {
    let signedAt = moment(guest.updatedAt).format('MM/DD/YYYY [at] h:mm:ss a');
    let address = guest.ethAddress;
    return (
      <p key={guest.ethAddress}>
        {signedAt} + {address}
      </p>
    );
  });

  return (
    <>
      <span>bruh</span>
      <br />
      {GuestList}
    </>
  );
}
