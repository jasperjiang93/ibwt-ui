import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[rgba(212,175,55,0.2)] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-2xl font-bold text-gold-gradient">IBWT</div>
          <div className="flex gap-6 sm:gap-8">
            <FooterLink href="https://twitter.com/ibwtai">Twitter</FooterLink>
            <FooterLink href="https://t.me/+Rz18rco54585MmUx">Telegram</FooterLink>
            <FooterLink href="https://discord.gg/XZpZ6Aq2mG">Discord</FooterLink>
          </div>
          <div className="text-[#666] text-sm">&copy; 2026 In Bot We Trust</div>
        </div>
        <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.05)] text-center">
          <p className="text-[#666] text-sm">
            $IBWT powers settlement within the network.{" "}
            <Link href="/token" className="text-[#d4af37] hover:underline">
              Learn more about the token &rarr;
            </Link>
          </p>
        </div>
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
