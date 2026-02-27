'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { createClient } from '@/utils/supabase/client';
import type { Mercado } from '@/utils/types';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { getJettonWalletAddress, createUsdtTransferPayload, DESTINATION_ADDRESS } from '@/utils/ton';
import { toNano } from '@ton/core';

type Voto = 'si' | 'no';
type Paso = 'detalle' | 'compra' | 'exito';

const TIME_FILTERS = ['1D', '1W', '1M', 'ALL'];
const INCREMENTOS = [1, 5, 10, 100];

export default function MercadoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [tonConnectUI] = useTonConnectUI();
  const userAddress = useTonAddress();

  const [mercado, setMercado] = useState<Mercado | null>(null);
  const [loading, setLoading] = useState(true);
  const [paso, setPaso] = useState<Paso>('detalle');
  const [voto, setVoto] = useState<Voto | null>(null);
  const [monto, setMonto] = useState(0);
  const [timeFilter, setTimeFilter] = useState('1D');
  const [comprando, setComprando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMercado = async () => {
      const { data } = await supabase.from('mercados').select('*').eq('id', id).single();
      if (data) setMercado(data);
      setLoading(false);
    };
    fetchMercado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const abrirCompra = (v: Voto) => {
    setVoto(v);
    setMonto(0);
    setError(null);
    setPaso('compra');
  };

  const ajustarMonto = (delta: number) => {
    setMonto((prev) => Math.max(0, parseFloat((prev + delta).toFixed(2))));
  };

  const handleConfirmar = async () => {
    if (!mercado || !voto || monto <= 0) return;
    setComprando(true);
    setError(null);

    try {
      if (!userAddress) {
        throw new Error('Por favor, conecta tu wallet primero.');
      }

      // 1. Obtener la dirección de la wallet de USDT del usuario
      const userJettonWallet = await getJettonWalletAddress(userAddress);
      
      // 2. Crear el payload de transferencia de USDT
      const payload = createUsdtTransferPayload(
        DESTINATION_ADDRESS.toString(),
        monto,
        userAddress
      );

      // 3. Preparar la transacción para TON Connect
      // Al ser una billetera W5, la wallet (como Tonkeeper) detectará que es USDT 
      // y permitirá al usuario pagar el gas con su saldo de USDT.
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360, // 6 minutos
        messages: [
          {
            address: userJettonWallet,
            amount: '35000000', // 0.035 TON para cubrir el max de la transaccion del jetton
            payload: payload.toBoc().toString('base64'),
          },
        ],
      };

      // 4. Enviar transacción al usuario para firmar
      const result = await tonConnectUI.sendTransaction(transaction);
      
      if (!result) {
        throw new Error('La transacción no pudo ser completada.');
      }

      // 5. Si el pago fue exitoso (el usuario firmó), registramos en Supabase
      const { error: err } = await supabase.from('historial_operaciones').insert([{
        mercado_id: mercado.id,
        tipo_voto: voto,
        precio_pagado: monto,
        // Opcional: podrías guardar el hash de la transacción si 'result' lo proporciona (boc)
      }]);

      if (err) {
        console.error('Error recording operation:', err);
        // El pago ya se hizo en la blockchain, así que mostramos éxito pero avisamos?
        // O mejor simplemente procedemos ya que el dinero se envió.
      }

      // 6. Actualizar precios del mercado para reflejar la compra
      const inc = Math.min(0.05, monto * 0.005);
      let pSi = mercado.precio_si;
      let pNo = mercado.precio_no;
      if (voto === 'si') {
        pSi = parseFloat(Math.min(0.9, pSi + inc).toFixed(2));
        pNo = parseFloat((1 - pSi).toFixed(2));
      } else {
        pNo = parseFloat(Math.min(0.9, pNo + inc).toFixed(2));
        pSi = parseFloat((1 - pNo).toFixed(2));
      }
      
      await supabase.from('mercados').update({ precio_si: pSi, precio_no: pNo }).eq('id', mercado.id);
      setMercado({ ...mercado, precio_si: pSi, precio_no: pNo });

      setPaso('exito');
    } catch (e: any) {
      console.error('Payment error:', e);
      setError(e.message || 'Error al procesar el pago. Intenta de nuevo.');
    } finally {
      setComprando(false);
    }
  };

  // ── LOADING ──
  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-slate-100 border-t-[#2e5cff] rounded-full spinner" />
      </div>
    );
  }

  if (!mercado) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-3 px-6">
        <p className="text-lg font-semibold text-slate-600">Mercado no encontrado</p>
        <button onClick={() => router.push('/')} className="text-[#2e5cff] bg-transparent border-none cursor-pointer text-sm">Volver al inicio</button>
      </div>
    );
  }

  const porcSi = Math.round(mercado.precio_si * 100);
  const precioUnitario = voto === 'si' ? mercado.precio_si : mercado.precio_no;
  const acciones = precioUnitario > 0 ? parseFloat((monto / precioUnitario).toFixed(1)) : 0;
  const retornoPotencial = parseFloat((acciones / precioUnitario).toFixed(2));

  // ── SUCCESS ──
  if (paso === 'exito' && voto) {
    return (
      <div className="min-h-dvh bg-white flex flex-col">
        {/* Back button only */}
        <div className="px-4 pt-5 pb-2">
          <button
            onClick={() => router.push('/')}
            className="w-9 h-9 flex items-center justify-center rounded-full text-slate-900 bg-transparent border-none cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center pb-12">
          {/* Success icon */}
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6 scale-in">
            <div className="w-14 h-14 rounded-full border-[3px] border-green-500 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-1">¡Compra Exitosa!</h1>
          <p className="text-sm text-slate-500 mb-8">Tu orden ha sido procesada correctamente.</p>

          {/* Receipt card */}
          <div className="w-full max-w-sm bg-white border border-slate-100 rounded-3xl p-5 text-left mb-6 shadow-sm">
            {/* Market info */}
            <div className="flex gap-3 items-start mb-5 pb-5 border-b border-slate-100">
              <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-slate-100">
                {mercado.imagen_url ? (
                  <img src={mercado.imagen_url} alt={mercado.titulo} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">📊</div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 leading-snug mb-1">{mercado.titulo}</p>
                <p className="text-xs text-slate-400">
                  {mercado.categoria || 'General'}
                  {mercado.categoria ? ' • Evento' : ''}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Posición</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${voto === 'si' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {voto === 'si' ? 'SÍ' : 'NO'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Acciones compradas</span>
                <span className="text-sm font-bold text-slate-900">{acciones} acciones</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Precio promedio</span>
                <span className="text-sm font-medium text-slate-700">${precioUnitario.toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <span className="text-sm font-bold text-slate-900">Total pagado</span>
                <span className="text-sm font-bold text-[#2e5cff]">${monto.toFixed(2)} USDC</span>
              </div>
            </div>
          </div>

          {/* Share */}
          <button className="flex items-center gap-2 text-sm font-medium text-slate-500 bg-transparent border-none cursor-pointer mb-8 hover:text-slate-700 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            Compartir esta predicción
          </button>

          {/* Actions */}
          <div className="flex flex-col gap-3 w-full max-w-sm">
            <button
              onClick={() => router.push(`/mercado/${mercado.id}`)}
              className="w-full bg-[#2e5cff] text-white border-none rounded-2xl py-4 text-[15px] font-bold cursor-pointer hover:opacity-90 transition-opacity"
            >
              Volver al mercado
            </button>
            <button
              onClick={() => router.push('/portafolio')}
              className="w-full bg-white text-slate-700 border border-slate-200 rounded-2xl py-4 text-[15px] font-semibold cursor-pointer hover:bg-slate-50 transition-colors"
            >
              Ver mi portafolio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN DETAIL VIEW ──
  return (
    <div className="min-h-dvh flex flex-col bg-white">
      <Header showBack backHref="/" showShare />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-40">

        {/* Category + Title */}
        <div className="px-5 py-6 flex flex-col gap-3">
          {mercado.categoria && (
            <span className="inline-flex bg-slate-100 text-slate-600 text-[10px] font-bold tracking-[0.25px] uppercase px-2 py-0.5 rounded-[2px] w-fit">
              {mercado.categoria}
            </span>
          )}
          <div className="flex gap-3.5 items-start">
            <div className="w-[72px] h-[72px] rounded-xl overflow-hidden shrink-0 bg-slate-100">
              {mercado.imagen_url ? (
                <img src={mercado.imagen_url} alt={mercado.titulo} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">📊</div>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 leading-snug flex-1">{mercado.titulo}</h1>
          </div>
        </div>

        {/* Stats row */}
        <div className="px-5 pb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-[36px] font-bold text-slate-900 tracking-[-0.9px] leading-10">{porcSi}%</span>
                <div className="flex items-center gap-0.5 text-emerald-600">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
                  </svg>
                  <span className="text-sm font-semibold">12%</span>
                </div>
              </div>
              <p className="text-[11px] font-bold text-slate-400 tracking-[1px] uppercase mt-1">Probabilidades del Sí</p>
            </div>
            <div className="flex bg-slate-50 border border-slate-100 rounded-full p-1.5">
              {TIME_FILTERS.map((t, i) => (
                <button
                  key={t}
                  onClick={() => setTimeFilter(t)}
                  className={`px-3 py-1 rounded-full border-none text-[10px] font-bold cursor-pointer transition-all
                    ${timeFilter === t ? 'bg-white shadow-sm text-slate-900' : 'bg-transparent text-slate-400'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="mt-4 h-44 rounded-xl overflow-hidden bg-gradient-to-b from-blue-50/60 to-transparent">
            <svg viewBox="0 0 350 150" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2e5cff" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#2e5cff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0 120 L40 110 L80 100 L120 90 L160 80 L200 70 L240 55 L280 40 L320 30 L350 20 L350 150 L0 150 Z" fill="url(#cg)" />
              <path d="M0 120 L40 110 L80 100 L120 90 L160 80 L200 70 L240 55 L280 40 L320 30 L350 20" fill="none" stroke="#2e5cff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="350" cy="20" r="5" fill="#2e5cff" />
            </svg>
          </div>
        </div>

        {/* Volume / Liquidez */}
        <div className="border-t border-b border-slate-50 flex">
          <div className="flex-1 p-5 border-r border-slate-50">
            <p className="text-[10px] font-bold text-slate-400 tracking-[0.5px] uppercase mb-1.5">Volumen</p>
            <p className="text-lg font-bold text-slate-900">$1,248,390</p>
          </div>
          <div className="flex-1 p-5">
            <p className="text-[10px] font-bold text-slate-400 tracking-[0.5px] uppercase mb-1.5">Liquidez</p>
            <p className="text-lg font-bold text-slate-900">$450,200</p>
          </div>
        </div>

        {/* About */}
        <div className="px-5 py-8">
          <h2 className="text-sm font-bold text-slate-400 tracking-[1.4px] uppercase mb-4">Acerca del mercado</h2>
          <p className="text-[15px] text-slate-600 leading-relaxed mb-5">
            {mercado.descripcion || 'Este mercado resolverá según el resultado del evento. Compra acciones de Sí o No según tu predicción.'}
          </p>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span className="text-sm font-bold text-slate-900">Fuente de resolución</span>
            </div>
            <ul className="flex flex-col gap-2">
              {['Fuentes oficiales verificadas', 'Basado en datos públicos y auditables', 'Resolución automática al finalizar el evento'].map((item) => (
                <li key={item} className="flex gap-2 text-sm text-slate-500 leading-snug">
                  <span>•</span><span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ────── BOTTOM PANEL ────── */}
      {paso === 'detalle' && (
        /* DETALLE: Sí / No buttons */
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] bg-white/95 backdrop-blur-[10px] border-t border-slate-100 px-5 pt-4 pb-8 z-50">
          <div className="flex gap-3">
            <button
              onClick={() => abrirCompra('si')}
              className="flex-1 bg-emerald-50 border border-emerald-200 rounded-2xl py-4 flex flex-col items-center gap-0.5 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span className="text-lg font-bold text-emerald-700">Sí ${mercado.precio_si.toFixed(2)}</span>
              <span className="text-[9px] font-bold text-emerald-700/70 uppercase tracking-[0.5px]">Comprar Acciones</span>
            </button>
            <button
              onClick={() => abrirCompra('no')}
              className="flex-1 bg-rose-50 border border-rose-200 rounded-2xl py-4 flex flex-col items-center gap-0.5 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span className="text-lg font-bold text-rose-700">No ${mercado.precio_no.toFixed(2)}</span>
              <span className="text-[9px] font-bold text-rose-700/70 uppercase tracking-[0.5px]">Comprar Acciones</span>
            </button>
          </div>
        </div>
      )}

      {paso === 'compra' && voto && (
        /* COMPRA: Bottom sheet */
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setPaso('detalle')}
          />

          {/* Sheet */}
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] bg-white rounded-t-3xl z-50 shadow-2xl">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            <div className="px-5 pb-8 pt-2">
              {/* Header: Comprar + dropdown indicator */}
              <div className="flex items-center gap-2 mb-5">
                <span className="text-lg font-bold text-slate-900">Comprar</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {/* Market context row */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    {mercado.imagen_url ? (
                      <img src={mercado.imagen_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">📊</div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 leading-tight line-clamp-2 max-w-[160px]">{mercado.titulo}</p>
                    {/* Voto badge */}
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md mt-1
                      ${voto === 'si' ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {voto === 'si' ? 'Sí' : 'No'}
                      {voto === 'si' ? (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                      )}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-400">Bal. $0.00</span>
              </div>

              {/* Amount: − $X + */}
              <div className="flex items-center justify-between mb-5">
                <button
                  onClick={() => ajustarMonto(-1)}
                  className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-700 text-xl font-light bg-white cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  –
                </button>
                <div className="text-center">
                  <span className="text-5xl font-bold tracking-[-1px]">
                    <span className="text-slate-300 text-4xl">$</span>
                    <span className={monto === 0 ? 'text-slate-300' : 'text-slate-900'}>{monto}</span>
                  </span>
                </div>
                <button
                  onClick={() => ajustarMonto(1)}
                  className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-700 text-xl font-light bg-white cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  +
                </button>
              </div>

              {/* Quick increments */}
              <div className="flex gap-2 mb-6">
                {INCREMENTOS.map((inc) => (
                  <button
                    key={inc}
                    onClick={() => ajustarMonto(inc)}
                    className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-700 text-[13px] font-semibold cursor-pointer hover:bg-slate-200 transition-colors border-none"
                  >
                    +${inc}
                  </button>
                ))}
                <button
                  onClick={() => setMonto(100)}
                  className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-700 text-[13px] font-semibold cursor-pointer hover:bg-slate-200 transition-colors border-none"
                >
                  Max
                </button>
              </div>

              {/* Summary rows */}
              <div className="flex flex-col gap-2.5 mb-5 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Acciones a comprar:</span>
                  <span className="font-medium text-slate-900">{acciones}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Precio por acción:</span>
                  <span className="font-medium text-slate-900">${precioUnitario.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Retorno potencial:</span>
                  <span className="font-bold text-[#2e5cff]">${retornoPotencial.toFixed(2)}</span>
                </div>
              </div>

              {error && <p className="text-xs text-red-500 text-center mb-3">{error}</p>}

              {/* CTA */}
              <button
                onClick={handleConfirmar}
                disabled={monto <= 0 || comprando}
                className={`w-full rounded-2xl py-4 text-[15px] font-bold border-none transition-all
                  ${monto <= 0
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-[#2e5cff] text-white cursor-pointer hover:opacity-90 active:opacity-80'
                  }`}
              >
                {comprando ? 'Procesando...' : 'Comprar'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
