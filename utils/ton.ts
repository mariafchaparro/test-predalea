import { Address, beginCell, toNano } from '@ton/core';
import { TonClient } from '@ton/ton';

export const USDT_MASTER_ADDRESS = Address.parse('EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs');
export const DESTINATION_ADDRESS = Address.parse('UQByPpKbkQIDH5TWPedP7SxdhLTA9M0f3fnxk7Ep8YwF7-33');

export async function getJettonWalletAddress(userAddress: string): Promise<string> {
  const client = new TonClient({
    endpoint: 'https://toncenter.com/api/v2/jsonRPC',
    // Nota: En producciÃ³n deberÃ­as usar una API key o un balanceador
  });

  const result = await client.runMethod(
    USDT_MASTER_ADDRESS,
    'get_wallet_address',
    [{ type: 'slice', cell: beginCell().storeAddress(Address.parse(userAddress)).endCell() }]
  );

  return result.stack.readAddress().toString();
}

export function createUsdtTransferPayload(recipientAddress: string, amount: number, senderAddress: string) {
  // USDT has 6 decimals
  const amountInUnits = BigInt(Math.round(amount * 1_000_000));

  return beginCell()
    .storeUint(0xf8a7ea5, 32) // op::transfer
    .storeUint(0, 64) // query_id
    .storeCoins(amountInUnits)
    .storeAddress(Address.parse(recipientAddress))
    .storeAddress(Address.parse(senderAddress)) // response_destination
    .storeMaybeRef(null) // no custom payload
    .storeCoins(toNano('0')) // forward_ton_amount (0 para gasless o mínimo)
    .storeMaybeRef(null) // no forward payload
    .endCell();
}
