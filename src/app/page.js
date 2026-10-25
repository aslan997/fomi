import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const PARTS = [
  {
    href: "/implementation",
    label: "Part A",
    title: "Mockup implementation",
    body: "A faithful, responsive build of the supplied Fomi image generator design, wired to the mocked generation API.",
  },
  {
    href: "/workspace",
    label: "Part B",
    title: "Creative workspace",
    body: "An original AI image workspace built around creative branching: iterate on a direction instead of starting over.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium text-neutral-500">Fomi · Frontend Developer Assessment</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">Two deliverables, one codebase.</h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-neutral-600">
        Both parts run against a mocked <code className="rounded bg-neutral-100 px-1 py-0.5 text-[13px]">POST /api/generate</code>{" "}
        endpoint. No real AI generation takes place; results come from a local image library.
      </p>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {PARTS.map((part) => (
          <li key={part.href}>
            <Link
              href={part.href}
              className="group flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-6 transition-[border-color,box-shadow] duration-200 hover:border-neutral-300 hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.18)]"
            >
              <span className="flex items-center justify-between text-xs font-medium tracking-wide text-neutral-500 uppercase">
                {part.label}
                <ArrowUpRight
                  size={16}
                  className="text-neutral-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-neutral-900"
                  aria-hidden="true"
                />
              </span>
              <span className="mt-4 text-lg font-semibold text-neutral-900">{part.title}</span>
              <span className="mt-2 text-sm leading-relaxed text-neutral-600">{part.body}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
