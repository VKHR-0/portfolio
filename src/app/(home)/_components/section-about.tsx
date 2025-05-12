import ISkill from "@/types/skill";

import { PortableText } from "@portabletext/react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface SectionAboutProps {
  skills: ISkill[];
}

const SectionAbout = ({ skills }: SectionAboutProps) => {
  return (
    <section
      id="about"
      className="bg-black-tertiary relative rounded-t-2xl pt-8 pb-14 text-white before:absolute before:inset-0 before:rounded-t-2xl before:border-t-[3px] before:border-r-[2px] before:border-b-0 before:border-l-[2px] before:border-white/25 before:from-white/25 before:to-transparent"
    >
      <div className="relative container mx-auto space-y-6">
        <h2 className="font-kanit text-center text-6xl font-bold">About Me</h2>
        <div className="flex items-start justify-center gap-10">
          <aside className="shadow-card inset-shadow-card-inner flex w-full max-w-[425px] flex-col gap-6 rounded-2xl bg-black p-6 pb-8">
            <Image
              src="/images/me.png"
              alt="Profile"
              width={375}
              height={375}
              className="rounded-lg"
            />
            <div className="space-y-2.5">
              <h3 className="font-kanit text-2xl font-semibold">
                Hello I am <span className="text-white/60">Viktor Harhat</span>
              </h3>
              <p className="font-convergence text-base text-white/60">
                Software Engineer & Full-Stack Web Developer
              </p>
            </div>
            <ul className="flex items-center justify-center gap-4">
              <li>
                <Link href="https://github.com/0Empty0" target="_blank">
                  <Image
                    src="/images/icons/github.svg"
                    alt="gh"
                    width={32}
                    height={32}
                  />
                </Link>
              </li>
              <span className="inline-block h-6 w-px bg-white/25"></span>
              <li>
                <Link href="https://t.me/emptyType" target="_blank">
                  <Image
                    src="/images/icons/telegram.svg"
                    alt="gh"
                    width={32}
                    height={32}
                  />
                </Link>
              </li>
              <span className="inline-block h-6 w-px bg-white/25"></span>
              <li>
                <Link href="https://twitter.com/Empty_type" target="_blank">
                  <Image
                    src="/images/icons/twitter.svg"
                    alt="gh"
                    width={32}
                    height={32}
                  />
                </Link>
              </li>
              <span className="inline-block h-6 w-px bg-white/25"></span>
              <li>
                <Link href="mailto:viktor.harhatt@gmail.com" target="_blank">
                  <Image
                    src="/images/icons/email.svg"
                    alt="gh"
                    width={32}
                    height={32}
                  />
                </Link>
              </li>
            </ul>
            <Link
              href="https://drive.google.com/file/d/1poV2F2AHTvpi060R57rmZCQri14vENpQ/view?usp=sharing"
              target="_blank"
              className="black-button text-center"
            >
              Resume (CV)
            </Link>
          </aside>
          <article className="shadow-card inset-shadow-card-inner flex w-full max-w-[675px] flex-col gap-8 rounded-2xl bg-black p-6 pb-8 text-white/60">
            <p>
              Pellentesque suscipit fringilla libero eu ullamcorper. Cras risus
              eros, faucibus sit amet augue id, tempus pellentesque eros. In
              imperdiet tristique tincidunt. Integer lobortis lorem lorem, id
              accumsan arcu tempor id.
            </p>
            <hr className="border-white/75" />

            {skills
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((skill, index) => (
                <React.Fragment key={skill._id || index}>
                  <div className="space-y-3">
                    <h4 className="font-kanit text-2xl font-semibold text-white">
                      {skill.title}
                    </h4>
                    <ul className="flex flex-wrap gap-2.5 text-white">
                      {skill.badges.map((badge, index) => (
                        <li
                          key={index}
                          className="shadow-card inset-shadow-card-inner w-fit rounded-md border border-white/25 px-3"
                        >
                          <p>{badge.technology}</p>
                        </li>
                      ))}
                    </ul>
                    <div className="prose prose-invert max-w-none text-white/60">
                      <PortableText value={skill.description} />
                    </div>
                  </div>

                  <hr className="border-white/75 last:hidden" />
                </React.Fragment>
              ))}
          </article>
        </div>
      </div>
    </section>
  );
};

export default SectionAbout;
