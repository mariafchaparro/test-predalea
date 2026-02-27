import Header from '@/components/Header';

export default function PerfilPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-white relative">
      <Header />

      <div className="flex-1 overflow-y-auto pb-32">
        {/* -- Avatar & Name Section -- */}
        <div className="pt-8 pb-10 flex flex-col items-center">
          <div className="relative mb-4">
            {/* Avatar Circle */}
            <div 
              className="size-24 rounded-full flex items-center justify-center p-1 relative shadow-lg"
              style={{ backgroundImage: "linear-gradient(135deg, rgb(99, 102, 241) 0%, rgb(217, 70, 239) 100%)" }}
            >
              <div className="absolute inset-x-0 inset-y-0 rounded-full border-4 border-white shadow-inner pointer-events-none" />
              <span className="text-3xl font-bold text-white z-10">S</span>
            </div>
            
            {/* Verified Badge Icon (overlapping) */}
            <div className="absolute bottom-0 right-0 size-6 bg-white rounded-full p-[2px] flex items-center justify-center shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#2e5cff" stroke="white" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2l2.36 1.83.67 2.9L18 8l-1.09 2.8L19.27 13.5l-2.07 2.14L16.5 18.5 13.71 17.5l-2.43 1.5-2.26-1.92-2.9-.67L5.5 13.5l2.07-2.14L6.87 8.5l2.43-1.5L12 2z" stroke="none" />
                <path d="M9 12l2 2 4-4" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Santiago</h1>
          
          <div className="bg-[#eff6ff] px-3 py-1 rounded-full flex gap-1.5 items-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#3b60e4" stroke="#eff6ff" strokeWidth="2"><path d="M12 2l2.36 1.83.67 2.9L18 8l-1.09 2.8L19.27 13.5l-2.07 2.14L16.5 18.5 13.71 17.5l-2.43 1.5-2.26-1.92-2.9-.67L5.5 13.5l2.07-2.14L6.87 8.5l2.43-1.5L12 2z" stroke="none"/><path d="M9 12l2 2 4-4" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="text-sm font-semibold text-[#3b60e4] uppercase tracking-wide">VERIFICADO</span>
          </div>
        </div>

        {/* -- Stats Row -- */}
        <div className="px-6 flex gap-4 mb-10 w-full max-w-md mx-auto">
          <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-1 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">REPUTACIÓN</span>
            <div className="text-[22px] font-bold text-slate-900 flex items-center gap-1">
              4.9
              <span className="text-[#fbbf24] text-lg">★</span>
            </div>
          </div>
          <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-1 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">PREDICCIONES</span>
            <div className="text-[22px] font-bold text-slate-900">
              128
            </div>
          </div>
        </div>

        {/* -- Menu List -- */}
        <div className="px-6 w-full max-w-md mx-auto mb-10">
          <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4 px-2">CONFIGURACIÓN DE CUENTA</h3>
          
          <div className="flex flex-col">
            {/* ITEM: Seguridad y Privacidad */}
            <button className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors w-full bg-transparent border-none cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="size-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <span className="text-base font-medium text-slate-900">Seguridad y Privacidad</span>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>

            {/* ITEM: Métodos de Pago */}
            <button className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors w-full bg-transparent border-none cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="size-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <line x1="2" x2="22" y1="10" y2="10" />
                  </svg>
                </div>
                <span className="text-base font-medium text-slate-900">Métodos de Pago</span>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>

            {/* ITEM: Notificaciones */}
            <button className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors w-full bg-transparent border-none cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="size-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </svg>
                </div>
                <span className="text-base font-medium text-slate-900">Notificaciones</span>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>

            {/* ITEM: Ayuda y Soporte */}
            <button className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors w-full bg-transparent border-none cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="size-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <path d="M12 17h.01" />
                  </svg>
                </div>
                <span className="text-base font-medium text-slate-900">Ayuda y Soporte</span>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </div>

        {/* -- Logout & Version -- */}
        <div className="px-6 w-full max-w-md mx-auto flex flex-col items-center gap-6">
          <button className="w-full bg-[#fef2f2] border border-red-100 text-[#ef4444] rounded-2xl py-4 px-6 flex items-center justify-center gap-2 font-bold text-base cursor-pointer hover:bg-red-50 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Cerrar Sesión
          </button>
          
          <span className="text-xs font-medium text-slate-400">Predalea v2.4.0 (LATAM)</span>
        </div>
      </div>
    </div>
  );
}
