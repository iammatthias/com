/** @jsx jsx */
import React from 'react' //eslint-disable-line

import { jsx } from 'theme-ui'

function Icon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="50"
      height="50"
      fill="none"
      viewBox="0 0 377 377"
      strokeWidth="15"
      sx={{ stroke: 'text' }}
      {...props}
    >
      <mask
        id="mask0"
        width="377"
        height="377"
        x="0"
        y="0"
        maskUnits="userSpaceOnUse"
      >
        <circle
          cx="188.5"
          cy="188.5"
          r="180.5"
          stroke="#ffffff"
          fill="#ffffff"
        ></circle>
      </mask>
      <g mask="url(#mask0)">
        <circle cx="188.5" cy="188.5" r="180.5"></circle>
        <path d="M12 169.5L365 169.5"></path>
        <path d="M155 284H31l36.69-63.5L96.87 170"></path>
        <path d="M205 284l-61.5-107L82 284h123z"></path>
        <path
          {...props}
          sx={{ fill: 'background' }}
          d="M347.205 284l-86.602-150L174 284h173.205z"
        ></path>
        <path d="M297.205 284l-86.602-150L124 284h173.205z"></path>
        <path
          {...props}
          sx={{ fill: 'background' }}
          d="M297.205 284l-86.602-150L124 284h173.205z"
        ></path>
      </g>
    </svg>
  )
}

export default Icon
