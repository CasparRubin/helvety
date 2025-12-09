import Image from "next/image";

export const revalidate = 60 * 60 * 24; // cache statically for a day

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center">
          <Image
            src="/logo_whiteBg.svg"
            alt="Helvety logo"
            width={1200}
            height={300}
            className="w-full max-w-3xl h-auto mb-24 mx-auto"
            sizes="(max-width: 768px) 90vw, (max-width: 1280px) 70vw, 960px"
            priority
          />
          <div className="space-y-2">
            <p className="text-xl md:text-2xl leading-snug">
              <span>Software and Apparel</span>
            </p>
            <p className="text-sm md:text-base text-black/70">developed and designed in <span className="text-[#FF0000]">Switzerland</span></p>
          </div>
          <div className="border-t border-black/30 mt-24 mb-8" />
          <p className="text-base md:text-lg text-black/50">contact@helvety.com</p>
        </div>
      </div>
    </main>
  );
}
