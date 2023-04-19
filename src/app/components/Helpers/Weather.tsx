export default async function Weather() {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=33.77&longitude=-118.19&current_weather=true&temperature_unit=fahrenheit`
  );
  const data = await res.json();

  const wmo_code = {
    "0": "Clear",
    "1": "Clear",
    "2": "Cloudy",
    "3": "Overcast",
    "45": "Fog",
    "48": "Fog",
    "51": "Drizzle",
    "53": "Drizzle",
    "55": "Drizzle",
    "56": "Drizzle",
    "57": "Drizzle",
    "61": "Rain",
    "63": "Rain",
    "65": "Rain",
    "66": "Rain",
    "67": "Rain",
    "71": "Snow",
    "73": "Snow",
    "75": "Snow",
    "77": "Snow",
    "80": "Rain",
    "81": "Rain",
    "82": "Rain",
    "85": "Snow",
    "86": "Snow",
    "95": "Thunderstorm",
    "96": "Thunderstorm",
    "99": "Thunderstorm",
  } as any;

  const temperature = data.current_weather.temperature;
  const weathercode = data.current_weather.weathercode;

  const _weathercode = wmo_code[weathercode];

  return (
    <>
      <p>{temperature}°</p>

      <p>{_weathercode}</p>
    </>
  );
}
