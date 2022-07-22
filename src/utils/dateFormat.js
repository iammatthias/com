export default function dateFormat(date) {
  const _date = new Date(
    date.replace(/-/g, `/`).replace(/T.+/, ``),
  ).toLocaleDateString(`en-us`);
  return _date;
}
