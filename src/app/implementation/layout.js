import { Poppins } from "next/font/google";

// Poppins matches the geometric sans in the reference mockup. Loaded only for
// this route so Part B doesn't pay for it.
const poppins = Poppins({
  variable: "--font-poppins-face",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Part A — Image Generator",
};

export default function ImplementationLayout({ children }) {
  return <div className={poppins.variable}>{children}</div>;
}
