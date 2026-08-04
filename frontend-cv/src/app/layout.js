import "./globals.css";
import BootstrapLoader from "./components/BootstrapLoader";

export const metadata = {
  title: "Fatih Syauqi - Senior Software Engineer Portfolio & CV",
  description: "CV & Portfolio website of Fatih Syauqi, an experienced Senior Software Engineer specializing in Mobile Applications, Web APIs, React Native, and C# .NET.",
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
