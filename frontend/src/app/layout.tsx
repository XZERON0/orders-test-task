import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { UserSwitcher } from "@/components/UserSwitcher";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Заказы",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <Providers>
          <header className="header">
            <nav>
              <Link href="/orders">Заказы</Link>
              <Link href="/products">Остатки</Link>
            </nav>
            <UserSwitcher />
          </header>
          <main className="main">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
