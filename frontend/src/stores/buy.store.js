import BigNumber from 'bignumber.js';
import EthereumTx from 'ethereumjs-tx';
import { ecsign } from 'ethereumjs-util';

import appStore from './app.store';
import auctionStore from './auction.store';
import backend from '../backend';
import { int2hex, hex2buf, buildABIData } from '../utils';

const BUYIN_SIG = '0xd0280037';

const GAS_LIMIT = new BigNumber(200000);
// 5 Gwei
const GAS_PRICE = new BigNumber(5000000000);

export const GAS_VALUE = GAS_LIMIT.mul(GAS_PRICE);

class BuyStore {
  async purchase (address, spending, privateKey) {
    console.warn('buying tokens for', spending.toFormat());

    const { contractAddress, STATEMENT_HASH } = auctionStore;

    if (!address || !privateKey) {
      throw new Error('no address or no private key');
    }

    try {
      const privateKeyBuf = Buffer.from(privateKey.slice(2), 'hex');
      const nonce = await backend.nonce(address);
      const { v, r, s } = ecsign(hex2buf(STATEMENT_HASH), privateKeyBuf);
      const data = buildABIData(BUYIN_SIG, v, r, s);

      const tx = new EthereumTx({
        to: contractAddress,
        nonce,
        data,
        gasLimit: int2hex(GAS_LIMIT),
        gasPrice: int2hex(GAS_PRICE),
        value: int2hex(spending)
      });

      tx.sign(privateKeyBuf);

      const serializedTx = `0x${tx.serialize().toString('hex')}`;
      const { hash } = await backend.sendTx(serializedTx);

      console.warn('sent purchase', { hash });
    } catch (error) {
      appStore.addError(error);
      appStore.goto('contribute');
    }
  }
}

export default new BuyStore();
