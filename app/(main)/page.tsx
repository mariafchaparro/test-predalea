'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { createClient } from '@/utils/supabase/client';
import type { Mercado } from '@/utils/types';

const CATEGORIAS = ['Tendencias', 'Política', 'Deportes', 'Economía', 'Tecnología'];

export default function InicioPage() {
  const [mercados, setMercados] = useState<Mercado[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState('Tendencias');
  const [busqueda, setBusqueda] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const obtenerMercados = async () => {
    setLoading(true);
    let query = supabase.from('mercados').select('*').eq('finalizado', false);
    if (categoriaActiva !== 'Tendencias') {
      query = query.ilike('categoria', categoriaActiva);
    }
    const { data } = await query.order('id', { ascending: false });
    if (data) setMercados(data);
    setLoading(false);
  };

  useEffect(() => {
    obtenerMercados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriaActiva]);

  const mercadosFiltrados = mercados.filter((m) =>
    m.titulo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div>
      <Header />

      {/* Search */}
      <div className="px-5 pt-5">
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Busca eventos o mercados..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-[#f4f5f6] border-none rounded-[14px] py-3.5 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="overflow-x-auto hide-scrollbar px-5 pt-4">
        <div className="flex gap-2 w-max">
          {CATEGORIAS.map((cat) => {
            const active = categoriaActiva === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap border transition-all duration-150
                  ${active
                    ? 'bg-[#e8eefe] text-[#2e5cff] font-semibold border-transparent shadow-sm'
                    : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
                  }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Markets List */}
      <div className="px-5 pt-5">
        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-900">Mercados Activos</h1>
          <button className="text-sm font-semibold text-slate-600 bg-transparent border-none cursor-pointer">
            Ver todos
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-50 rounded-3xl h-36 skeleton" />
            ))}
          </div>
        ) : mercadosFiltrados.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-5xl mb-3">📊</div>
            <p className="text-base font-semibold text-slate-600">No hay mercados activos</p>
            <p className="text-sm mt-1">Crea el primero desde la pestaña Mercados</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {mercadosFiltrados.map((m) => {
              const porcSi = Math.round(m.precio_si * 100);
              const porcNo = Math.round(m.precio_no * 100);
              const lidero = porcSi >= porcNo ? 'Sí' : 'No';
              const porcLider = Math.max(porcSi, porcNo);
              const porcOtro = Math.min(porcSi, porcNo);

              return (
                <div
                  key={m.id}
                  className="bg-white border border-slate-100 rounded-3xl p-[21px] flex flex-col gap-4"
                >
                  {/* Top: image + title */}
                  <div className="flex gap-4 items-start">
                    <div className="w-[43px] h-[43px] rounded-lg overflow-hidden shrink-0 bg-slate-100">
                      {m.imagen_url ? (
                        <img
                          src={m.imagen_url}
                          alt={m.titulo}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">📊</div>
                      )}
                    </div>
                    <h3 className="text-[15px] font-bold text-slate-900 leading-snug flex-1">
                      {m.titulo}
                    </h3>
                  </div>

                  {/* Bottom: bar + button */}
                  <div className="flex gap-3 items-center">
                    {/* Progress section */}
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {lidero}{' '}
                          <span className="text-[#2e5cff]">{porcLider}%</span>
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          {lidero === 'Sí' ? `No ${porcNo}%` : `Sí ${porcSi}%`}
                        </span>
                      </div>
                      <div className="bg-slate-50 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#2e5cff] rounded-full transition-all duration-500"
                          style={{ width: `${lidero === 'Sí' ? porcSi : porcNo}%` }}
                        />
                      </div>
                    </div>

                    {/* Bet button */}
                    <button
                      onClick={() => router.push(`/mercado/${m.id}`)}
                      className="bg-[#2e5cff] text-white border-none rounded-2xl px-[18px] py-3 text-sm font-bold cursor-pointer shrink-0 hover:opacity-85 active:opacity-70 transition-opacity"
                    >
                      Apostar
                    </button>
                  </div>

                  {/* Volume */}
                  <span className="text-xs font-medium text-slate-400 -mt-2">
                    $10M Vol.
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
