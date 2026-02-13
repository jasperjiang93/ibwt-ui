import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[rgba(212,175,55,0.2)] py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-2xl font-bold text-gold-gradient">IBWT</div>
        <div className="flex gap-8">
          <FooterLink href="https://twitter.com/ibwtai">Twitter</FooterLink>
          <FooterLink href="https://t.me/+Rz18rco54585MmUx">Telegram</FooterLink>
          <FooterLink href="https://discord.gg/XZpZ6Aq2mG">Discord</FooterLink>
        </div>
        <div className="text-[#666] text-sm">&copy; 2026 In Bot We Trust</div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const isExternal = href.startsWith("http");
  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#888] hover:text-[#e5e5e5] transition"
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className="text-[#888] hover:text-[#e5e5e5] transition">
      {children}
    </Link>
  );
}
