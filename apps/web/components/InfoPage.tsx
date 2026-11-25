import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
export function InfoPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: { title: string; text: string }[];
}) {
  return (
    <main id="main-content" className="info-page">
      <span className="hero-tag">
        <ShieldCheck size={14} />
        TRUSTLAYER · TEST-NETWORK RELEASE
      </span>
      <h1>{title}</h1>
      <p className="info-intro">{intro}</p>
      {sections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          <p>{section.text}</p>
        </section>
      ))}
      <Link className="btn primary" href="/app">
        Open workspace <ArrowUpRight size={16} />
      </Link>
    </main>
  );
}
