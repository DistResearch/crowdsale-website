import { observer } from 'mobx-react';
import React, { Component } from 'react';
import { Button, Header, Loader } from 'semantic-ui-react';

import buyStore from '../../stores/buy.store';
import config from '../../stores/config.store';

@observer
export default class FeePayment extends Component {
  componentWillMount () {
    buyStore.watchPurchase();
  }

  componentWillUnmount () {
    buyStore.unwatchPurchase();
  }

  render () {
    const { transaction } = buyStore;
    const etherscanUrl = config.get('etherscan') + '/tx/' + transaction;

    return (
      <div style={{ textAlign: 'center' }}>
        <Loader active inline='centered' size='huge' />

        <Header as='h2' style={{ textTransform: 'uppercase' }}>
          Processing DOT purchase
        </Header>

        <p>
          Please wait until your order has been recorded on the blockchain.
        </p>

        <p>
          This can take several minutes or longer depending on the
          volume of transactions on the Ethereum network.
        </p>

        {
          transaction
            ? (
              <Button as='a' href={etherscanUrl} target='_blank' basic style={{ marginTop: '1em' }}>
                View transaction on Etherscan
              </Button>
            )
            : null
        }
      </div>
    );
  }
}
