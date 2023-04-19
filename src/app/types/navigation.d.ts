// types/navigation.d.ts
declare module "../data/navigation.json" {
  import { NavItem } from "../components/NavBar";

  const data: {
    links: NavItem[];
  };

  export default data;
}
