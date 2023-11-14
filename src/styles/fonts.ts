import localFont from "next/font/local";

// New York serif font
const NewYork = localFont({
  display: "swap",
  preload: true,
  src: "./font_files/NewYork.ttf",
  variable: "--new-york",
  weight: "variable",
});

// Monaspace font family
const MonaspaceArgon = localFont({
  display: "swap",
  preload: true,
  src: "./font_files/MonaspaceArgonVarVF[wght,wdth,slnt].ttf",
  variable: "--monaspace-argon",
  weight: "variable",
  declarations: [
    {
      prop: "font-feature-settings",
      value: '"calt" 1, "dlig" 1, "ss01" 1, "ss02" 1, "ss03" 1, "ss04" 1, "ss05" 1, "ss06" 1, "ss07" 1',
    },
  ],
});
const MonaspaceKrypton = localFont({
  display: "swap",
  preload: true,
  src: "./font_files/MonaspaceKryptonVarVF[wght,wdth,slnt].ttf",
  variable: "--monaspace-krypton",
  weight: "variable",
  declarations: [
    {
      prop: "font-feature-settings",
      value: '"calt" 1, "dlig" 1, "ss01" 1, "ss02" 1, "ss03" 1, "ss04" 1, "ss05" 1, "ss06" 1, "ss07" 1',
    },
  ],
});
const MonaspaceRadon = localFont({
  display: "swap",
  preload: true,
  src: "./font_files/MonaspaceRadonVarVF[wght,wdth,slnt].ttf",
  variable: "--monaspace-radon",
  weight: "variable",
  declarations: [
    {
      prop: "font-feature-settings",
      value: '"calt" 1, "dlig" 1, "ss01" 1, "ss02" 1, "ss03" 1, "ss04" 1, "ss05" 1, "ss06" 1, "ss07" 1',
    },
  ],
});
const MonaspaceXenon = localFont({
  display: "swap",
  preload: true,
  src: "./font_files/MonaspaceXenonVarVF[wght,wdth,slnt].ttf",
  variable: "--monaspace-xenon",
  weight: "variable",
  declarations: [
    {
      prop: "font-feature-settings",
      value: '"calt" 1, "dlig" 1, "ss01" 1, "ss02" 1, "ss03" 1, "ss04" 1, "ss05" 1, "ss06" 1, "ss07" 1',
    },
  ],
});

export { NewYork, MonaspaceArgon, MonaspaceKrypton, MonaspaceRadon, MonaspaceXenon };
