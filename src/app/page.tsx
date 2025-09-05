import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <header className="mb-24 text-center text-white">
          <Image
            src="/logo.svg"
            alt="Helvety logo"
            width={4000}
            height={1000}
            className="w-full h-auto mb-6"
            priority
          />
          <p className="mt-6 text-xl md:text-2xl leading-snug">
            <span className="font-bold block">Swiss</span>
            <span>Software and Apparel</span>
          </p>
        </header>
        <div className="border-t border-white my-16" />
        <div className="text-center text-white">
          <p className="text-base md:text-lg">
            <a className="underline underline-offset-4 hover:no-underline" href="mailto:contact@helvety.com">contact@helvety.com</a>
          </p>
        </div>
      </div>
    </main>
  );
}
