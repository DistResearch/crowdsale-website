import { countries } from 'country-data';
import Datamap from 'datamaps';
import React, { Component } from 'react';
import { Button, Card, Grid, Header, Icon, Modal } from 'semantic-ui-react';

import appStore from '../../stores/app.store';
import Text from '../ui/Text';

const VALID_COLOR = '#4a90e2';
const INVALID_COLOR = '#4d4d4d';
const BACKGROUND_COLOR = '#f2f2f2';

const mapStyle = {
  backgroundColor: BACKGROUND_COLOR,
  padding: '1.5em 1em',
  borderRadius: '1em'
};

export default class CountrySelector extends Component {
  state = {
    showInvalidModal: false
  };

  componentWillMount () {
    this.blacklistedCountriesNames = appStore.blacklistedCountries
      .map((countryKey) => {
        let name = countries[countryKey].name.split(',');

        if (name.length === 2) {
          return name[1] + ' ' + name[0];
        }

        return name[0];
      });

    this.mapData = appStore.blacklistedCountries
      .reduce((data, countryKey) => {
        data[countryKey] = { fillKey: 'DISABLED' };
        return data;
      }, {});

    window.addEventListener('resize', this.resize);
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.resize);
  }

  render () {
    return (
      <div>
        <Header as='h2' textAlign='center'>
          CHOOSE YOUR CITIZENSHIP
        </Header>

        {this.renderInvalidModal()}

        <Text>
          Are you a citizen of, resident in, or established in one of these countries: People's Republic of
          China or the United States of America?
        </Text>

        <Grid>
          <Grid.Column tablet={16} computer={8}>
            <Card fluid link style={mapStyle} onClick={this.handleInvalid}>
              <div ref={this.setInvalidRef} style={{ height: '150px' }} />
            </Card>

            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontWeight: 'bold',
                fontSize: '1.3em'
              }}>
                Yes
              </p>
            </div>
          </Grid.Column>

          <Grid.Column tablet={16} computer={8}>
            <Card fluid link style={mapStyle} onClick={this.handleContinue}>
              <div ref={this.setValidRef} style={{ height: '150px' }} />
            </Card>

            <div style={{ textAlign: 'center', fontSize: '1.3em' }}>
              <p>No</p>
            </div>
          </Grid.Column>
        </Grid>
      </div>
    );
  }

  renderInvalidModal () {
    const { showInvalidModal } = this.state;

    return (
      <Modal
        basic
        open={showInvalidModal}
        onClose={this.handleCloseInvalid}
        size='small'
      >
        <Header icon='world' content='EXCLUDED COUNTRIES' />
        <Modal.Content>
          <Text>
            We apologize but you are unable to participate in the sale.
          </Text>
        </Modal.Content>
        <Modal.Actions>
          <Button inverted onClick={this.handleCloseInvalid}>
            <Icon name='close' /> Close
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }

  resize = () => {
    this.resizeMap(this.invalidMap);
    this.resizeMap(this.validMap);
  }

  resizeMap (map) {
    if (!map) {
      return;
    }

    const container = map.options.element;
    const svg = container.querySelector('svg');
    const g = svg.querySelector('g');

    const prevWidth = svg.getAttribute('data-width');

    // Get container new width
    const nextWidth = container.clientWidth;
    const nextHeight = 9 / 16 * nextWidth;

    // Update container and map SVG
    svg.setAttribute('height', nextHeight);
    svg.setAttribute('width', nextWidth);
    container.style.height = `${nextHeight}px`;

    const scale = nextWidth / prevWidth;

    g.setAttribute('transform', `scale(${scale})`);

    const gMeasures = g.getBoundingClientRect();
    const svgMeasures = svg.getBoundingClientRect();
    const tY = (svgMeasures.top - gMeasures.top) + (svgMeasures.height - gMeasures.height) / 2;

    // Update map width
    g.setAttribute('transform', `scale(${scale}) translate(0, ${tY / scale})`);
  }

  createMap = (element, invalid = false) => {
    return new Datamap({
      projection: 'mercator',
      geographyConfig: {
        highlightOnHover: false,
        popupOnHover: false
      },
      fills: {
        defaultFill: invalid ? INVALID_COLOR : VALID_COLOR,
        DISABLED: invalid ? VALID_COLOR : INVALID_COLOR
      },
      // responsive: true,
      data: this.mapData,
      element
    });
  };

  handleCloseInvalid = () => {
    this.setState({ showInvalidModal: false });
  };

  handleInvalid = () => {
    this.setState({ showInvalidModal: true });
  };

  handleContinue = () => {
    // appStore.storeValidCitizenship(this.state.country.iso3);
    appStore.goto('account-selection');
  };

  setInvalidRef = (element) => {
    if (!element) {
      return;
    }

    this.invalidMapElement = element;
    this.invalidMap = this.createMap(element, true);
    this.resize();
  };

  setValidRef = (element) => {
    if (!element) {
      return;
    }

    this.validMapElement = element;
    this.validMap = this.createMap(element, false);
    this.resize();
  };
}
