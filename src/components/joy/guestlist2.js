/** @jsx jsx */

import React from 'react'; //eslint-disable-line
import { jsx, Box } from 'theme-ui';
import { darken } from '@theme-ui/color';
import moment from 'moment';
import Link from './link';

import { useAuth } from '../../hooks/use-auth';

import { useEns } from '../../hooks/use-ens';

import { usePromise } from '../../hooks/use-promise';

export default function GuestList() {
  const { guestbookLog } = useAuth();
  const guests = guestbookLog();
  const { lookup } = useEns();

  // class Signature extends React.Component {
  //   constructor(props) {
  //     super(props);
  //     const data = [];
  //     this.state = { data, name: '' };
  //   }

  //   render() {
  //     const { data } = this.state;

  //     const itemList = data.map(function (item) {
  //       let signedDate = moment(item.updatedAt).format(
  //         'MM/DD/YYYY [at] h:mm:ss a'
  //       );
  //       let address = item.ethAddress;

  //       const ensName = lookup(address);

  //       const name = usePromise(ensName);

  //       console.log(name);

  //       return (
  //         <Box
  //           key={item.ethAddress}
  //           sx={{
  //             borderBottom: '1px solid',
  //             borderColor: darken('background', 0.025),
  //             my: '1rem',
  //           }}
  //         >
  //           <small sx={{ m: 0, p: '0 0 1rem', fontWeight: 'bold' }}>
  //             {signedDate}
  //           </small>
  //           <p sx={{ m: 0, p: '0 0 1rem' }}>
  //             <Link
  //               href={'https://etherscan.io/address/' + item.ethAddress}
  //               sx={{ fontWeight: 'normal', textDecoration: 'none' }}
  //             >
  //               {item.ethAddress}
  //               <br />
  //             </Link>
  //           </p>
  //         </Box>
  //       );
  //     });
  //     return (
  //       <Box
  //         key="guestbook"
  //         sx={{
  //           borderTop: '1px solid',
  //           borderColor: darken('background', 0.25),
  //           width: ['100%', '61.8%'],
  //         }}
  //       >
  //         {itemList}
  //       </Box>
  //     );
  //   }
  //   componentDidMount() {
  //     guests.then((data) => {
  //       this.setState({ data });
  //     });
  //   }
  // }

  return (
    <>
      <div>foo</div>
      {/* <Signature /> */}
    </>
  );
}
