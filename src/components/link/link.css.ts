import { style } from '@vanilla-extract/css';
import { atoms } from '@/styles/atoms.css';

export const link = [
  atoms({
    color: {
      mobile: `darkBlue`,
      hover: `darkGreen`,
      visited: `darkGreen`,
    },
  }),
  style({
    transition: `color 5.1618s ease-in-out`,
  }),
];
