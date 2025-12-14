import React from "react";
import "./globals.css";

export const metadata = {
  title: "Ultra Coach",
  description: "Personalized ultra running coach and scheduler.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header>
          <nav style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <span style={{ fontWeight: 600 }}>Ultra Coach</span>
            <a href="/">Home</a>
            <a href="/today">Today</a>
            <a href="/week">Week</a>
            <a href="/settings">Settings</a>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
  
