// @ts-nocheck
// Este archivo es código Deno (Edge Function de Supabase). Los errores de VS Code son normales
// porque el TS LSP no conoce los tipos de Deno. La función funciona correctamente en Supabase.
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { mnemonicToPrivateKey } from 'npm:@ton/crypto';
import {
  WalletContractV4,
  TonClient,
  internal,
  beginCell,
  Address,
  toNano,
} from 'npm:@ton/ton';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Dirección master del contrato USDT (Jetton) en TON mainnet
const USDT_MASTER = Address.parse('EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs');

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { mercado_id } = await req.json() as { mercado_id: string };

    // Variables de entorno (configurar en Supabase Dashboard > Edge Functions > Secrets)
    const mnemonic = Deno.env.get('TON_MNEMONIC');
    if (!mnemonic) {
      return new Response(
        JSON.stringify({ error: 'TON_MNEMONIC no configurado. Ve a Supabase > Edge Functions > Secrets y agrega las 24 palabras.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cliente Supabase con service role (sin restricciones de RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 1. Obtener ganadores no pagados de este mercado
    const { data: ganadores, error } = await supabase
      .from('historial_operaciones')
      .select('*')
      .eq('mercado_id', mercado_id)
      .eq('pagado', false)
      .gt('monto_ganado', 0);

    if (error) throw new Error(`Error leyendo ganadores: ${error.message}`);

    if (!ganadores || ganadores.length === 0) {
      return new Response(
        JSON.stringify({ success: true, mensaje: 'No hay ganadores pendientes de pago.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Configurar la wallet empresarial firmante usando las 24 palabras
    const mnemonicWords = mnemonic.trim().split(/\s+/);
    const keyPair = await mnemonicToPrivateKey(mnemonicWords);

    const workchain = 0;
    const wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });

    const client = new TonClient({
      endpoint: 'https://toncenter.com/api/v2/jsonRPC',
    });

    const contract = client.open(wallet);
    const seqno = await contract.getSeqno();

    // 3. Obtener la Jetton Wallet de la empresa para enviar USDT
    const companyJettonWalletAddr = await getJettonWallet(client, USDT_MASTER, wallet.address);

    // 4. Enviar USDT a cada ganador uno por uno
    const pagados: string[] = [];
    let seqnoActual = seqno;

    for (const ganador of ganadores) {
      if (!ganador.wallet_address) {
        console.warn(`Operación ${ganador.id} sin wallet_address, saltando.`);
        continue;
      }

      const montoUsdt = Number(ganador.monto_ganado);
      const amountUnits = BigInt(Math.round(montoUsdt * 1_000_000)); // USDT = 6 decimales

      // Payload Jetton transfer (envío de USDT)
      const transferPayload = beginCell()
        .storeUint(0xf8a7ea5, 32)   // op::transfer
        .storeUint(0, 64)            // query_id
        .storeCoins(amountUnits)     // cantidad en micro-USDT
        .storeAddress(Address.parse(ganador.wallet_address)) // destino
        .storeAddress(wallet.address)  // response_destination (exceso de TON de vuelta)
        .storeMaybeRef(null)
        .storeCoins(toNano('0.000000001')) // forward_ton mínimo para notificación
        .storeMaybeRef(null)
        .endCell();

      await contract.sendTransfer({
        seqno: seqnoActual,
        secretKey: keyPair.secretKey,
        messages: [
          internal({
            to: companyJettonWalletAddr,
            value: toNano('0.05'), // TON para el gas del jetton transfer
            body: transferPayload,
          }),
        ],
      });

      // Marcar como pagado en la DB
      await supabase
        .from('historial_operaciones')
        .update({ pagado: true })
        .eq('id', ganador.id);

      pagados.push(`${ganador.id} → ${ganador.wallet_address} (${montoUsdt.toFixed(4)} USDT)`);
      seqnoActual++;

      // Esperar entre transacciones para que cada una tenga un seqno único
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }

    return new Response(
      JSON.stringify({ success: true, pagados: pagados.length, detalle: pagados }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error en pagar-ganadores:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper: obtener la Jetton Wallet address para un owner dado
async function getJettonWallet(
  client: TonClient,
  masterAddress: Address,
  ownerAddress: Address
): Promise<Address> {
  const result = await client.runMethod(masterAddress, 'get_wallet_address', [
    { type: 'slice', cell: beginCell().storeAddress(ownerAddress).endCell() },
  ]);
  return result.stack.readAddress();
}
