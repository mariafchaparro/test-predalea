'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { Mercado } from '@/utils/types';

export default function AdminPage() {
  const supabase = createClient();
  const [mercados, setMercados] = useState<Mercado[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolviendo, setResolviendo] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const cargarMercados = async () => {
    setLoading(true);
    const { data } = await supabase.from('mercados').select('*').order('id', { ascending: false });
    if (data) setMercados(data);
    setLoading(false);
  };

  useEffect(() => { cargarMercados(); }, []); // eslint-disable-line

  const resolver = async (mercado: Mercado, resultado: 'si' | 'no') => {
    if (!confirm(`¿Resolver "${mercado.titulo}" como ${resultado.toUpperCase()}?`)) return;
    setResolviendo(mercado.id);
    addLog(`Resolviendo mercado "${mercado.titulo}" como ${resultado.toUpperCase()}...`);

    try {
      const res = await fetch('/api/resolver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mercado_id: mercado.id, resultado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error desconocido');
      addLog(`✅ Mercado resuelto. Ganadores: ${data.ganadores}. Payout total: $${data.totalPayout?.toFixed(2)} USDT`);
      addLog(`💸 Edge function de pago invocada. Revisa las wallets de los ganadores.`);
      cargarMercados();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      addLog(`❌ Error: ${message}`);
    } finally {
      setResolviendo(null);
    }
  };

  const activos = mercados.filter((m) => !m.finalizado);
  const finalizados = mercados.filter((m) => m.finalizado);

  return (
    <div style={{ minHeight: '100dvh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#1e293b', color: 'white', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 22 }}>🛡️</span>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Panel de Administración</h1>
          <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>Resolución de mercados y pagos</p>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Active markets */}
        <section>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            Mercados Activos ({activos.length})
          </h2>

          {loading ? (
            <p style={{ color: '#64748b', fontSize: 14 }}>Cargando...</p>
          ) : activos.length === 0 ? (
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
              No hay mercados activos
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activos.map((m) => (
                <div key={m.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Market info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0f172a', lineHeight: 1.4 }}>{m.titulo}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                      Sí: {Math.round(m.precio_si * 100)}% · No: {Math.round(m.precio_no * 100)}%
                      {m.categoria && ` · ${m.categoria}`}
                    </p>
                  </div>

                  {/* Resolve buttons */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => resolver(m, 'si')}
                      disabled={resolviendo === m.id}
                      style={{
                        background: resolviendo === m.id ? '#f1f5f9' : '#dcfce7',
                        color: '#16a34a',
                        border: '1px solid #bbf7d0',
                        borderRadius: 8,
                        padding: '7px 14px',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: resolviendo === m.id ? 'not-allowed' : 'pointer',
                        transition: 'opacity 0.15s',
                      }}
                    >
                      {resolviendo === m.id ? '⏳' : '✅ SÍ'}
                    </button>
                    <button
                      onClick={() => resolver(m, 'no')}
                      disabled={resolviendo === m.id}
                      style={{
                        background: resolviendo === m.id ? '#f1f5f9' : '#fee2e2',
                        color: '#dc2626',
                        border: '1px solid #fca5a5',
                        borderRadius: 8,
                        padding: '7px 14px',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: resolviendo === m.id ? 'not-allowed' : 'pointer',
                        transition: 'opacity 0.15s',
                      }}
                    >
                      {resolviendo === m.id ? '⏳' : '❌ NO'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Resolved markets */}
        {finalizados.length > 0 && (
          <section>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8', display: 'inline-block' }} />
              Mercados Resueltos ({finalizados.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {finalizados.map((m) => (
                <div key={m.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, opacity: 0.75 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#475569' }}>{m.titulo}</p>
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                    background: m.resultado === 'si' ? '#dcfce7' : '#fee2e2',
                    color: m.resultado === 'si' ? '#16a34a' : '#dc2626',
                    border: `1px solid ${m.resultado === 'si' ? '#bbf7d0' : '#fca5a5'}`,
                  }}>
                    {m.resultado ? m.resultado.toUpperCase() : 'RESUELTO'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Log */}
        {log.length > 0 && (
          <section>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>📋 Log de actividad</h2>
            <div style={{ background: '#1e293b', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {log.map((l, i) => (
                <p key={i} style={{ margin: 0, fontSize: 12, color: l.startsWith('❌') ? '#f87171' : l.startsWith('✅') || l.startsWith('💸') ? '#86efac' : '#94a3b8', fontFamily: 'monospace' }}>{l}</p>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
