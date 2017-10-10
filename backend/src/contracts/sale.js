// Copyright Parity Technologies (UK) Ltd., 2017.
// Released under the Apache 2/MIT licenses.

'use strict';

const BigNumber = require('bignumber.js');
const { uniq } = require('lodash');

const { SecondPriceAuction } = require('../abis');
const Contract = require('../api/contract');
const log = require('../logger');
const { int2date } = require('../utils');

const STATICS = [
  'ERA_PERIOD',
  'DUST_LIMIT',
  'STATEMENT_HASH',
  'STATEMENT',
  'BONUS_SIZE',
  'BONUS_DURATION',
  'USDWEI',
  'DIVISOR',

  'admin',
  'beginTime',
  'certifier',
  'tokenCap',
  'tokenContract',
  'treasury'
];

class Sale extends Contract {
  /**
   * Abstraction over the sale contract, found here:
   * https://github.com/paritytech/second-price-auction/blob/master/src/contracts/SecondPriceAuction.sol
   *
   * @param {Object} connector  A ParityConnector
   * @param {String} address    `0x` prefixed
   */
  constructor (connector, address) {
    super(connector, address, SecondPriceAuction, STATICS);

    this._chartData = [];
    this.init();
  }

  async init () {
    try {
      await this.fetchChartLogs();
      await this.subscribe([ 'Buyin', 'Injected' ], (logs) => this.addChartLogs(logs));
    } catch (error) {
      console.error(error);
    }
  }

  async update () {
    try {
      await super.update();
      log.trace(`Price is ${this.values.currentPrice.toFormat()} wei`);
    } catch (err) {
      console.error(err);
    }
  }

  get chartData () {
    return this._chartData;
  }

  async fetchChartLogs () {
    const logs = await this.logs([
      'Buyin',
      'Injected'
    ]);

    await this.addChartLogs(logs);
  }

  async addChartLogs (logs) {
    try {
      const blockNumbers = uniq(logs.map((log) => log.blockNumber));
      const blocks = await Promise.all(blockNumbers.map((bn) => this.connector.getBlock(bn)));

      logs.forEach((log) => {
        const bnIndex = blockNumbers.indexOf(log.blockNumber);
        const block = blocks[bnIndex];

        log.timestamp = int2date(block.timestamp);
      });

      let totalAccounted = new BigNumber(0);

      const parsedLogs = logs
        .sort((logA, logB) => logA.timestamp - logB.timestamp)
        .map((log) => {
          const { accounted } = log.params;

          totalAccounted = totalAccounted.add(accounted);

          return {
            totalAccounted: '0x' + totalAccounted.toString(16),
            time: log.timestamp
          };
        });

      this._chartData = this.chartData.concat(parsedLogs);
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = Sale;
