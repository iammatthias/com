import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export function useEns() {
  return {
    lookup: async (address) => {
      try {
        const provider = new ethers.providers.JsonRpcProvider(
          process.env.GATSBY_MORALIS_NODE
        );

        try {
          var name = await provider.lookupAddress(address);

          try {
            return this.state({ name: name });
          } catch (e) {
            console.error(e.message, e);
          }
        } catch (e) {
          console.error(e.message, e);
        }
      } catch (e) {
        console.error(e.message, e);
      }
    },
  };
}
