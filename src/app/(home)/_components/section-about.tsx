import ExpandingText from "@/components/expanding-text";
import Image from "next/image";
import Link from "next/link";

const SectionAbout = () => {
  return (
    <section
      className="scroller-section relative min-h-screen p-16 text-zinc-100"
      id="about"
    >
      <ExpandingText
        parentClassName="text-6xl font-semibold uppercase"
        overlapClassName="bg-zinc-100 h-20"
        textClassName="h-20 mb-8 max-md:text-center"
        element="h2"
      >
        About
      </ExpandingText>
      <div className="container mx-auto grid grid-cols-[1.25fr_0.75fr] gap-x-8 max-lg:grid-cols-1">
        <div>
          <article className="prose prose-lg prose-invert mb-6 text-balance">
            <p>
              I am a <strong>Full-Stack web developer</strong> with over a year
              of experience. I work freelance building high-performance and rich
              interactive websites that work across all platforms and devices.
            </p>
            <p>
              My core stack includes <strong>Next.js</strong> for the frontend
              and <strong>Nest.js</strong> for the backend, with a dabble in
              various types of databases(<strong>MongoDB</strong>,{" "}
              <strong>PostgreSQL</strong>), caching and containerization
              technologies.
            </p>
            <p>
              Although I position myself as a web developer, I also have
              experience in <strong>Python</strong>, <strong>Rust</strong>,{" "}
              <strong>Lua</strong>, <strong>C++</strong>, and have used them to
              develop web scraping tools, telegram bots, game development, etc.
            </p>
            <p>
              {`With a strong emphasis on "progressive enhancement", I look
              for creative ways to push the boundaries of a website's front-end
              code without compromising browser support and performance.`}
            </p>
            <p>
              In an effort to stay up-to-date, I read books, take courses,
              attend conferences and meetups, and explore new things.
            </p>
          </article>
          <Link
            href="#"
            className="inline-block w-full bg-zinc-100 px-14 py-5 text-center text-xl font-semibold text-zinc-950"
          >
            Curriculum Vitae (PDF)
          </Link>
        </div>
        <ul className="text-xl *:flex *:gap-2 max-lg:hidden">
          <li>
            Github:{" "}
            <Link href="https://github.com/0Empty0" className="font-medium">
              @0Empty0{" "}
              <Image
                className="inline"
                src="/images/icons/github.svg"
                alt="gh"
                width={32}
                height={32}
              />
            </Link>
          </li>
          <li>
            Telegram:{" "}
            <Link href="https://t.me/emptyType" className="font-medium">
              @emptyType{" "}
              <Image
                className="inline"
                src="/images/icons/telegram.svg"
                alt="gh"
                width={32}
                height={32}
              />
            </Link>
          </li>
          <li>
            Twitter:{""}
            <Link href="https://twitter.com/Empty_type" className="font-medium">
              @Empty_type{" "}
              <Image
                className="inline"
                src="/images/icons/twitter.svg"
                alt="gh"
                width={32}
                height={32}
              />
            </Link>
          </li>
          <li>
            Email:{" "}
            <Link href="mailto:garg.victor11@gmail.com" className="font-medium">
              garg.victor11@gmail.com{" "}
              <Image
                className="inline"
                src="/images/icons/email.svg"
                alt="gh"
                width={32}
                height={32}
              />
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
};

export default SectionAbout;
