import Header from "@/components/layout/header";
import type { Metadata } from "next";
import Footer from "@/components/layout/footer";
import { Suspense } from "react";
import Loading from "../loading";

export const metadata: Metadata = {
  title: "Viktor Harhat | Portfolio",
  description: "A portfolio website showcasing my skills and projects.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <Suspense fallback={<Loading />}>
        <main className="flex-1 basis-auto w-full">{children}</main>
      </Suspense>
      <Footer />
    </>
  );
}
