// a header component

import { header } from './header.css';
import Time from '@/utils/time';

// data
import { GetIP } from '@/lib/getIP';
import { GetIPLocation } from '@/lib/getIPLocation';
import { GetWeather } from '@/lib/getWeather';

export default function Header() {
  // get ip
  const ip = GetIP();

  // get ip location
  const location = GetIPLocation(ip);

  // split location into lat and lon
  const _location = location.split(`,`);
  const lat = _location[0];
  const lon = _location[1];

  // get weather
  const weather = GetWeather({ lat, lon });

  const temp = weather ? weather?.forecast[0].temperature : 0;

  return (
    <header className={`${header}`}>
      <span>{temp}°F</span>
      <span>
        <Time />
      </span>
    </header>
  );
}
