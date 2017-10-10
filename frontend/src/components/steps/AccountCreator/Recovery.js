import { observer } from 'mobx-react';
import React, { Component } from 'react';
import { Form, Grid, Header, Segment } from 'semantic-ui-react';

import appStore from '../../../stores/app.store';
import accountCreator from './accountCreator.store';

const RECOVERY_VERIFICATION = 'I have written down my recovery phrase';

@observer
export default class Recovery extends Component {
  state = {
    recoveryVerification: ''
  };

  valid () {
    const { recoveryVerification } = this.state;

    return (recoveryVerification.trim() === RECOVERY_VERIFICATION);
  }

  render () {
    const { phrase } = accountCreator;
    const { recoveryVerification } = this.state;
    const valid = this.valid();

    return (
      <Grid>
        <Grid.Column width={6}>
          <Header as='h3'>
            WRITE DOWN YOUR RECOVERY PHRASE
          </Header>
          <div style={{ lineHeight: '2em' }}>
            <p>
              You will need this for the next step.
            </p>
            <p>
              <b>WRITE IT DOWN</b>. Should you lose your password and/or
              JSON wallet file, your recovery phrase will restore access to
              your wallet.
            </p>
          </div>
        </Grid.Column>
        <Grid.Column width={10}>
          <Header as='h4'>
            Your recovery phrase
          </Header>

          <Segment>
            {phrase}
          </Segment>

          <p>
            Please type “<b>{RECOVERY_VERIFICATION}</b>” into the box below.
          </p>

          <Form onSubmit={this.handleNext}>
            <div ref={this.setFocus}>
              <Form.Input
                onChange={this.handleRecoveryVerificationChange}
                value={recoveryVerification}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1em' }}>
              <Form.Button type='button' onClick={this.handleBack} secondary>
                Back
              </Form.Button>

              <Form.Button
                type='submit'
                primary
                disabled={!valid}
              >
                Next
              </Form.Button>
            </div>
          </Form>
        </Grid.Column>
      </Grid>
    );
  }

  handleBack = (event) => {
    if (event) {
      event.preventDefault();
    }

    appStore.goto('create-account-password');
  };

  handleNext = async (event) => {
    if (event) {
      event.preventDefault();
    }

    appStore.goto('create-account-repeat');
  };

  handleRecoveryVerificationChange = (_, { value }) => {
    this.setState({ recoveryVerification: value });
  };

  setFocus = (element) => {
    if (!element) {
      return;
    }

    const input = element.querySelector('input');

    if (input) {
      return input.focus();
    }
  };
}
