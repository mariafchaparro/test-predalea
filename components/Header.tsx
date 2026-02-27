import Link from 'next/link';

interface HeaderProps {
  showBack?: boolean;
  backHref?: string;
  showShare?: boolean;
}

export default function Header({ showBack = false, backHref = '/', showShare = false }: HeaderProps) {
  return (
    <header className="sticky top-0 left-0 right-0 flex items-center justify-between py-3 px-4 border-b border-slate-100 backdrop-blur-md bg-white/92 z-50">

      {/* Left */}
      {showBack ? (
        <Link
          href={backHref}
          className="flex items-center justify-center w-9 h-9 rounded-full text-slate-900 no-underline hover:bg-slate-100 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
      ) : (
        <div className="w-9" />
      )}

      {/* Center: Logo */}
      <Link href="/" className="flex items-center gap-2 no-underline">
        <div className="w-5 h-5 rounded-[5px] flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2e5cff, #165a92)' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        </div>
        <span className="text-base font-semibold tracking-[-0.45px]" style={{ color: '#165a92' }}>
          Predalea
        </span>
      </Link>

      {/* Right */}
      {showShare ? (
        <button className="flex items-center justify-center w-9 h-9 rounded-full border-none bg-transparent cursor-pointer text-slate-900 hover:bg-slate-100 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
          <div className="w-9 h-9 rounded-full shrink-0" style={{ background: 'linear-gradient(180deg, #5570f4, #fe38b5)' }} />
        </div>
      )}
    </header>
  );
}
