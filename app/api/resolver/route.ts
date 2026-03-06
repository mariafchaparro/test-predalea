import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente admin con service role (tiene permisos para leer/escribir todo)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Necesitas agregar esta variable
);

export async function POST(req: NextRequest) {
  try {
    const { mercado_id, resultado } = await req.json() as { mercado_id: string; resultado: 'si' | 'no' };

    if (!mercado_id || !resultado || !['si', 'no'].includes(resultado)) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }

    // 1. Obtener el mercado para saber los precios
    const { data: mercado, error: mercadoError } = await supabaseAdmin
      .from('mercados')
      .select('*')
      .eq('id', mercado_id)
      .single();

    if (mercadoError || !mercado) {
      return NextResponse.json({ error: 'Mercado no encontrado' }, { status: 404 });
    }

    if (mercado.finalizado) {
      return NextResponse.json({ error: 'Este mercado ya fue resuelto' }, { status: 400 });
    }

    // 2. Marcar el mercado como finalizado con el resultado
    const { error: updateError } = await supabaseAdmin
      .from('mercados')
      .update({ finalizado: true, resultado })
      .eq('id', mercado_id);

    if (updateError) throw new Error(`Error actualizando mercado: ${updateError.message}`);

    // 3. Obtener todos los ganadores del mercado
    //    Ganadores = quienes apostaron por la opción correcta
    const { data: ganadores, error: ganadoresError } = await supabaseAdmin
      .from('historial_operaciones')
      .select('*')
      .eq('mercado_id', mercado_id)
      .eq('tipo_voto', resultado); // Solo los que apostaron correcto

    if (ganadoresError) throw new Error(`Error obteniendo ganadores: ${ganadoresError.message}`);

    if (!ganadores || ganadores.length === 0) {
      return NextResponse.json({
        success: true,
        mensaje: 'Mercado resuelto. No hay ganadores que pagar.',
        ganadores: 0,
        totalPayout: 0,
      });
    }

    // 4. Calcular monto_ganado para cada ganador
    //    Fórmula: cada acción vale $1 al resolver.
    //    Acciones = precio_pagado / precio_opcion_ganadora
    //    Payout = acciones * $1 = precio_pagado / precio_ganador
    const precioGanador = resultado === 'si' ? mercado.precio_si : mercado.precio_no;

    const updates = ganadores.map((op: { id: string; precio_pagado: number }) => ({
      id: op.id,
      monto_ganado: parseFloat((op.precio_pagado / precioGanador).toFixed(4)),
    }));

    const totalPayout = updates.reduce((s: number, u: { id: string; monto_ganado: number }) => s + u.monto_ganado, 0);

    // 5. Actualizar monto_ganado en cada operación ganadora
    for (const upd of updates) {
      await supabaseAdmin
        .from('historial_operaciones')
        .update({ monto_ganado: upd.monto_ganado })
        .eq('id', upd.id);
    }

    // 6. Llamar a la Edge Function de pago (si está configurada)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/pagar-ganadores`;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let payoutInvocado = false;
    try {
      const payoutRes = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ mercado_id }),
      });

      if (payoutRes.ok) {
        payoutInvocado = true;
      } else {
        const errBody = await payoutRes.text();
        console.warn('Edge function pagar-ganadores retornó error:', errBody);
      }
    } catch (edgeErr) {
      console.warn('No se pudo invocar la edge function de pago:', edgeErr);
      // No bloqueamos: el mercado ya se resolvió, el pago puede hacerse manualmente
    }

    return NextResponse.json({
      success: true,
      ganadores: ganadores.length,
      totalPayout,
      payoutInvocado,
      mensaje: payoutInvocado
        ? `Mercado resuelto. Se envió USDT a ${ganadores.length} ganador(es).`
        : `Mercado resuelto. Pago pendiente (configura TON_MNEMONIC para pago automático).`,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error en /api/resolver:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
