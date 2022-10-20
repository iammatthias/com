// a header component

import { header } from './header.css';
import Time from '@/utils/time';

// data
import { GetIP } from '@/lib/getIP';
import { GetIPLocation } from '@/lib/getIPLocation';
import { GetWeather } from '@/lib/getWeather';

export default function Header() {
  const ip = GetIP();
  const { lat, lon } = GetIPLocation(ip);
  const weather = GetWeather({ lat, lon });
  const temp = weather ? weather.forecast[0].temperature : 0;

  return (
    <header className={`${header}`}>
      <span>{temp}°F</span>
      <span>
        <Time />
      </span>
    </header>
  );
}
