'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { createClient } from '@/utils/supabase/client';
import type { HistorialOperacion, Mercado } from '@/utils/types';

interface PosicionAgrupada {
  mercado: Mercado;
  tipo_voto: 'si' | 'no';
  totalPagado: number;
  precioActual: number;
  acciones: number;
  retorno: number;
  retornoPct: number;
}

export default function PortafolioPage() {
  const supabase = createClient();
  const router = useRouter();
  const [posiciones, setPosiciones] = useState<PosicionAgrupada[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarPortafolio = async () => {
      setLoading(true);

      // Get all operations
      const { data: historial, error: historialError } = await supabase
        .from('historial_operaciones')
        .select('*')
        .order('creado_at', { ascending: false });

      console.log("Historial Fetch:", historial, historialError);

      if (!historial || historial.length === 0) {
        setLoading(false);
        return;
      }

      // Get unique market IDs
      const mercadoIds = [...new Set(historial.map((h: HistorialOperacion) => h.mercado_id))];

      const { data: mercados } = await supabase
        .from('mercados')
        .select('*')
        .in('id', mercadoIds);

      if (!mercados) {
        setLoading(false);
        return;
      }

      // Group operations by market + vote type
      const grupos = new Map<string, PosicionAgrupada>();

      for (const op of historial as HistorialOperacion[]) {
        const mercado = mercados.find((m: Mercado) => m.id === op.mercado_id);
        if (!mercado) continue;

        const key = `${op.mercado_id}-${op.tipo_voto}`;
        const precioActual = op.tipo_voto === 'si' ? mercado.precio_si : mercado.precio_no;

        if (grupos.has(key)) {
          const g = grupos.get(key)!;
          g.totalPagado += op.precio_pagado;
          g.acciones = precioActual > 0 ? parseFloat((g.totalPagado / precioActual).toFixed(1)) : 0;
          g.retorno = parseFloat((g.acciones * (1 - precioActual)).toFixed(2));
          g.retornoPct = g.totalPagado > 0
            ? parseFloat(((g.retorno / g.totalPagado) * 100).toFixed(1))
            : 0;
        } else {
          const totalPagado = op.precio_pagado;
          const acciones = precioActual > 0 ? parseFloat((totalPagado / precioActual).toFixed(1)) : 0;
          const retorno = parseFloat((acciones * (1 - precioActual)).toFixed(2));
          const retornoPct = totalPagado > 0 ? parseFloat(((retorno / totalPagado) * 100).toFixed(1)) : 0;

          grupos.set(key, {
            mercado,
            tipo_voto: op.tipo_voto,
            totalPagado,
            precioActual,
            acciones,
            retorno,
            retornoPct,
          });
        }
      }

      setPosiciones(Array.from(grupos.values()));
      setLoading(false);
    };

    cargarPortafolio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inversionTotal = posiciones.reduce((s, p) => s + p.totalPagado, 0);
  const gananciaTotal = posiciones.reduce((s, p) => s + p.retorno, 0);
  const valorPortafolio = inversionTotal + gananciaTotal;
  const gananciaHoy = gananciaTotal;
  const gananciaPct = inversionTotal > 0 ? ((gananciaTotal / inversionTotal) * 100).toFixed(1) : '0.0';
  const esPositivo = gananciaTotal >= 0;

  return (
    <div>
      <Header />

      <div className="pb-6">
        {/* ── Hero: Portfolio Value ── */}
        <div className="px-5 pt-8 pb-8 border-b border-slate-50">
          <p className="text-[11px] font-bold text-slate-400 tracking-[1.1px] uppercase mb-1">Valor del Portafolio</p>

          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-[36px] font-bold text-slate-900 tracking-[-0.9px]">
              ${valorPortafolio.toFixed(2)}
            </span>
            <span className="text-base font-medium text-slate-400">USDC</span>
          </div>

          {/* Change badge */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-bold
              ${esPositivo
                ? 'bg-green-50 border-green-100 text-green-700'
                : 'bg-red-50 border-red-100 text-red-600'
              }`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {esPositivo
                  ? <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>
                  : <><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></>
                }
              </svg>
              {esPositivo ? '+' : ''}${Math.abs(gananciaHoy).toFixed(2)} ({esPositivo ? '+' : ''}{gananciaPct}%)
            </div>
            <span className="text-xs font-medium text-slate-400">Hoy</span>
          </div>

          {/* Deposit / Withdraw */}
          <div className="flex gap-4 mt-6">
            <button className="flex-1 flex items-center justify-center gap-2 bg-[#2e5cff] text-white rounded-xl py-3.5 text-base font-bold border-none cursor-pointer hover:opacity-90 transition-opacity">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Depositar
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 bg-white text-slate-900 border border-slate-200 rounded-xl py-3.5 text-base font-bold cursor-pointer hover:bg-slate-50 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 8v-1a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v1" /><polyline points="7 14 12 9 17 14" /><line x1="12" y1="9" x2="12" y2="21" />
              </svg>
              Retirar
            </button>
          </div>
        </div>

        {/* ── Positions ── */}
        <div className="px-5 pt-6 flex flex-col gap-4">
          {/* Section title */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Posiciones Activas</h2>
            <button className="text-sm font-bold text-[#165a92] bg-transparent border-none cursor-pointer">Detalles</button>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-slate-50 rounded-2xl skeleton" />
              ))}
            </div>
          ) : posiciones.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">💼</div>
              <p className="text-base font-semibold text-slate-600 mb-1">Sin posiciones aún</p>
              <p className="text-sm text-slate-400 mb-6">Empieza apostando en un mercado</p>
              <button
                onClick={() => router.push('/')}
                className="bg-[#2e5cff] text-white px-6 py-3 rounded-2xl text-sm font-bold border-none cursor-pointer hover:opacity-90 transition-opacity"
              >
                Explorar mercados
              </button>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 tracking-[0.5px] uppercase">Mercado</span>
                <span className="text-[10px] font-bold text-slate-400 tracking-[0.5px] uppercase">Valor / Retorno</span>
              </div>

              {/* Table rows */}
              <div className="flex flex-col divide-y divide-slate-50">
                {posiciones.map((pos, i) => (
                  <div key={i} className="flex justify-between items-start py-4">
                    {/* Left: title + badge + shares */}
                    <div className="flex flex-col gap-2 pr-4 flex-1">
                      <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">{pos.mercado.titulo}</p>
                      <div className="flex items-center gap-2">
                        {/* Vote badge */}
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md
                          ${pos.tipo_voto === 'si'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-rose-50/60 text-red-500'
                          }`}>
                          {pos.tipo_voto === 'si' ? 'Sí' : 'No'}
                          {pos.tipo_voto === 'si' ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                          )}
                        </span>
                        <span className="text-[11px] text-slate-400">{pos.acciones} acciones</span>
                      </div>
                    </div>

                    {/* Right: value + return % */}
                    <div className="flex flex-col items-end justify-center py-3 gap-1 shrink-0">
                      <span className="text-sm font-bold text-slate-900">${pos.totalPagado.toFixed(2)}</span>
                      <span className={`text-[11px] font-bold ${pos.retornoPct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {pos.retornoPct >= 0 ? '+' : ''}{pos.retornoPct}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Full history button */}
              <button className="w-full flex items-center justify-center gap-2 bg-slate-50 border border-slate-100 rounded-xl py-4 text-sm font-bold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors mt-2">
                Ver historial completo
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* ── Summary stats ── */}
        {!loading && posiciones.length > 0 && (
          <div className="flex gap-4 px-5 mt-4">
            <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Inversión Total</p>
              <p className="text-lg font-bold text-slate-900">${inversionTotal.toFixed(2)}</p>
            </div>
            <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Ganancia Neta</p>
              <p className={`text-lg font-bold ${esPositivo ? 'text-green-600' : 'text-red-500'}`}>
                {esPositivo ? '+' : ''}${gananciaTotal.toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
