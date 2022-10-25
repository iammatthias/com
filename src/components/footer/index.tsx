import { footer, rightAlignDesktop } from "./footer.css";

import Time from "@/utils/time";
// import Date from "@/utils/date";

export default function Footer() {
  const time = Time();
  // const date = Date();

  return (
    <footer className={`${footer}`}>
      <p>@iammatthias</p>
      <div className={`${rightAlignDesktop}`}>
        <p>{time}</p>
        {/* <p>{date}</p> */}
      </div>
    </footer>
  );
}
