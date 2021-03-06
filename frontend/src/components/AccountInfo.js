import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Segment } from 'semantic-ui-react';

import backend from '../backend';
import blockStore from '../stores/block.store';
import { fromWei, toChecksumAddress } from '../utils';
import Logger from '../logger';

import AccountIcon from './AccountIcon.js';

const logger = Logger('AccountInfo');

export default class AccountInfo extends Component {
  static propTypes = {
    address: PropTypes.string.isRequired,
    showBalance: PropTypes.bool,
    showCertified: PropTypes.bool,
    onClick: PropTypes.func
  };

  static defaultProps = {
    showBalance: true,
    showCertified: true
  };

  state = {
    balance: null,
    certified: null
  };

  componentWillMount () {
    this.fetchInfo();
    blockStore.on('block', this.fetchInfo, this);
  }

  componentWillUnmount () {
    blockStore.removeListener('block', this.fetchInfo, this);
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.address !== this.props.address) {
      this.fetchInfo(nextProps);
    }
  }

  async fetchInfo (props = this.props) {
    try {
      const { address, showBalance, showCertified } = props;

      const nextState = {};

      if (showBalance) {
        const balance = await backend.balance(address);

        nextState.balance = balance;
      }

      if (showCertified) {
        const { certified } = await backend.getAddressInfo(address);

        nextState.certified = certified;
      }

      this.setState(nextState);
    } catch (error) {
      logger.error(error);
    }
  }

  render () {
    const { address: _address, onClick, showBalance, showCertified } = this.props;
    const { certified } = this.state;

    const address = toChecksumAddress(_address);

    const style = {
      padding: '0.75em 1em 0.75em 0.5em',
      display: 'inline-block',
      maxWidth: '100%'
    };

    if (onClick) {
      style.cursor = 'pointer';
    }

    if (certified !== null) {
      style.color = certified
        ? 'green'
        : 'grey';
    }

    return (
      <Segment compact style={style} onClick={onClick}>
        <div style={{ display: 'flex', maxWidth: '100%' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
            marginRight: '1em',
            flex: '0 0 auto'
          }}>
            <AccountIcon
              address={address}
              style={{ height: 48 }}
            />
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <span style={{
              fontFamily: 'monospace',
              fontSize: '1.0em',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {address}
            </span>
            {
              showCertified || showBalance
                ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    {this.renderBalance()}
                    {this.renderCertified()}
                  </div>
                )
                : null
            }
          </div>
        </div>
      </Segment>
    );
  }

  renderBalance () {
    const { showBalance } = this.props;
    const { balance } = this.state;

    if (!balance || !showBalance) {
      return <span />;
    }

    return (
      <span style={{
        wordWrap: 'break-word',
        overflow: 'hidden'
      }}>
        Current funds: <span title={`${fromWei(balance).toFormat()} ETH`}>{fromWei(balance).toFormat(5)} ETH</span>
      </span>
    );
  }

  renderCertified () {
    const { showCertified } = this.props;
    const { certified } = this.state;

    if (certified === null || !showCertified) {
      return null;
    }

    const color = certified
      ? 'green'
      : 'grey';

    const style = {
      borderColor: color,
      borderRadius: '1em',
      borderStyle: 'solid',
      borderWidth: '2px',
      color: color,
      fontSize: '0.85em',
      fontWeight: 'bold',
      padding: '0em 0.5em',
      marginLeft: '0.5em',
      lineHeight: '1.75em',
      flex: '0 0 auto'
    };

    return (
      <div style={style}>
        { certified ? 'Address certified' : 'Not yet certified' }
      </div>
    );
  }
}
