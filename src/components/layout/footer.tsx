import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="snap-end p-16 text-zinc-100">
      <div className="container mx-auto flex justify-between max-lg:flex-col gap-y-6">
        <Link className="max-lg:mx-auto" href="/">
          <Image src="/images/logo.svg" alt="logo" height={48} width={126} />
        </Link>
        <ul className="flex gap-4 text-xl *:flex *:gap-2 max-lg:flex-wrap max-lg:justify-center">
          <li>
            <Link href="https://github.com/0Empty0" className="font-medium">
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
          <li>
            <Link href="https://t.me/emptyType" className="font-medium">
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
          <li>
            <Link href="https://twitter.com/Empty_type" className="font-medium">
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
          <li>
            <Link href="mailto:garg.victor11@gmail.com" className="font-medium">
              <Image
                className="inline"
                src="/images/icons/email.svg"
                alt="gh"
                width={32}
                height={32}
              />{" "}
              garg.victor11@gmail.com
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
};

export default Footer;
