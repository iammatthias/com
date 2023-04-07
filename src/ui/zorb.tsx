import Box from "@/ui/box";
import styles from "./zorb.module.scss";

function ZorbSVG() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 110 110'>
      <defs>
        <radialGradient
          id='a'
          gradientTransform='translate(66.458 24.358) scale(75.2908)'
          gradientUnits='userSpaceOnUse'
          r={1}
          cx={0}
          cy='0%'>
          <stop offset='15.62%' stopColor='hsl(230, 71%, 90%)' />
          <stop offset='39.58%' stopColor='hsl(230, 73%, 85%)' />
          <stop offset='72.92%' stopColor='hsl(257, 77%, 76%)' />
          <stop offset='90.63%' stopColor='hsl(259, 87%, 68%)' />
          <stop offset='100%' stopColor='hsl(259, 92%, 67%)' />
        </radialGradient>
      </defs>
      <path
        d='M100 50c0-27.614-22.386-50-50-50S0 22.386 0 50s22.386 50 50 50 50-22.386 50-50Z'
        fill='url(#a)'
        transform='translate(5 5)'
      />
      <path
        stroke='rgba(0,0,0,0.075)'
        fill='transparent'
        d='M55 5.5c27.3 0 49.5 22.2 49.5 49.5S82.3 104.5 55 104.5 5.5 82.3 5.5 55 27.7 5.5 55 5.5z'
      />
    </svg>
  );
}

export default function Zorb(props: any) {
  return (
    <Box className={styles.zorb} {...props}>
      <ZorbSVG />
    </Box>
  );
}
