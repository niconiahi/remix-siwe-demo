import type { Config } from "tailwindcss"

export default {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        seriaIncreible: "#6F49A0 2px 4px 0px 0px",
        seExtranaALaNona: "#FE7F03 2px 4px 0px 0px",
        paraisoFiscal: "#CE6017 2px 4px 0px 0px",
        soneQueVolaba: "#006BA6 2px 4px 0px 0px",
        cuandoEricConocioAMilton: "#146139 2px 4px 0px 0px",
        miPrimoEsAsi: "#C56830 2px 4px 0px 0px",
        generacionDorada: "#FB7F14 2px 4px 0px 0px",
        brandBlue: "#015FA0 2px 4px 0px 0px",
      },
      colors: {
        google: {
          blue: "#4285F4",
        },
        brand: {
          blue: "#015FA0",
          blueHover: "#B3E0FF",
          red: "#FF0044",
          redHover: "#FFB2C7",
          stone: "#F2F2F2",
        },
        show: {
          seriaIncreible: {
            primary: "#6F49A0",
            primaryHover: "#D7CAE7",
            secondary: "#F8C552",
          },
          seExtranaALaNona: {
            primary: "#FE7F03",
            primaryHover: "#FFD8B3",
            secondary: "#51F5FA",
          },
          paraisoFiscal: {
            primary: "#CE6017",
            primaryHover: "#F5C4A3",
            secondary: "#9DE269",
          },
          soneQueVolaba: {
            primary: "#006BA6",
            primaryHover: "#B2E4FF",
            secondary: "#FF9600",
          },
          cuandoEricConocioAMilton: {
            primary: "#146139",
            primaryHover: "#95E9BE",
            secondary: "#F78214",
          },
          miPrimoEsAsi: {
            primary: "#C56830",
            primaryHover: "#EBC4AD",
            secondary: "#333186",
          },
          generacionDorada: {
            primary: "#FB7F14",
            primaryHover: "#FDC89B",
            secondary: "#FFE514",
          },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
