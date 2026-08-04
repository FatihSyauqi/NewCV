import "./globals.css";
import BootstrapLoader from "./components/BootstrapLoader";

export const metadata = {
  title: "Fatih Syauqi CV - Admin Content Management System",
  description: "Secure Content Management Panel for Fatih Syauqi's Portfolio & Curriculum Vitae Website.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <BootstrapLoader />
        {children}
      </body>
    </html>
  );
}
