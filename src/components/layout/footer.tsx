import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-black-tertiary relative w-full p-16 text-white before:absolute before:inset-0 before:rounded-2xl before:border-t-0 before:border-r-[2px] before:border-b-[3px] before:border-l-[2px] before:border-white/25 before:from-white/25 before:to-transparent">
      <div className="container mx-auto flex justify-between gap-y-6 max-lg:flex-col">
        <Link className="max-lg:mx-auto" href="/">
          <Image src="/images/logo.svg" alt="logo" height={36} width={95} />
        </Link>
        <ul className="flex gap-4 text-xl *:flex *:gap-2 *:transition-all *:duration-300 max-lg:flex-wrap max-lg:justify-center">
          <li className="hover:-translate-y-1">
            <Link
              href="https://github.com/0Empty0"
              className="font-medium hover:text-white"
              target="_blank"
            >
              <Image
                className="inline"
                src="/images/icons/github.svg"
                alt="gh"
                width={32}
                height={32}
              />{" "}
              @0Empty0
            </Link>
          </li>
          <li className="hover:-translate-y-1">
            <Link
              href="https://t.me/emptyType"
              className="font-medium hover:text-white"
              target="_blank"
            >
              <Image
                className="inline"
                src="/images/icons/telegram.svg"
                alt="gh"
                width={32}
                height={32}
              />{" "}
              @emptyType
            </Link>
          </li>
          <li className="hover:-translate-y-1">
            <Link
              href="https://twitter.com/Empty_type"
              className="font-medium hover:text-white"
              target="_blank"
            >
              <Image
                className="inline"
                src="/images/icons/twitter.svg"
                alt="gh"
                width={32}
                height={32}
              />{" "}
              @Empty_type
            </Link>
          </li>
          <li className="hover:-translate-y-1">
            <Link
              href="mailto:viktor.harhatt@gmail.com"
              className="font-medium hover:text-white"
              target="_blank"
            >
              <Image
                className="inline"
                src="/images/icons/email.svg"
                alt="gh"
                width={32}
                height={32}
              />{" "}
              viktor.harhatt@gmail.com
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
};

export default Footer;
