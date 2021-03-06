import React, { Component } from 'react';

import IFrame from '../ui/IFrame';
import picopsBackend from '../../picops-backend';
import appStore from '../../stores/app.store';

export default class PicopsTerms extends Component {
  render () {
    return (
      <IFrame
        onMessage={this.handleMessage}
        src={`${picopsBackend.baseUrl}/?no-padding#/tc`}
      />
    );
  }

  handleMessage = (_, message) => {
    if (message.action !== 'terms-accepted') {
      return;
    }

    if (!message.termsAccepted) {
      return;
    }

    appStore.goto('picops-country-selection');
  };
}
