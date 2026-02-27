'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? '#0f172a' : 'none'} stroke={active ? '#0f172a' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const GlobeIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#0f172a' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const WalletIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#0f172a' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const PersonIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#0f172a' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const navItems = [
  { href: '/', label: 'Inicio', Icon: HomeIcon },
  { href: '/mercados', label: 'Mercados', Icon: GlobeIcon },
  { href: '/portafolio', label: 'Portafolio', Icon: WalletIcon },
  { href: '/perfil', label: 'Perfil', Icon: PersonIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] flex items-center justify-around pt-[13px] pb-6 px-3 border-t border-slate-100 backdrop-blur-[10px] bg-white/85 z-[100]">
      {navItems.map(({ href, label, Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-[5px] no-underline px-3 py-1 min-w-[60px]"
          >
            <Icon active={active} />
            <span className={`text-[10px] leading-[15px] ${active ? 'font-bold text-slate-900' : 'font-medium text-slate-400'}`}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
