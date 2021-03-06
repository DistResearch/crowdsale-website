import { countries } from 'country-data';
import EventEmitter from 'eventemitter3';
import { difference, uniq } from 'lodash';
import { action, observable } from 'mobx';
import store from 'store';

import backend from '../backend';
import config from './config.store';
import history from './history';
import Logger from '../logger';

const logger = Logger('app-store');

export const CITIZENSHIP_LS_KEY = '_parity-crowdsale::citizenship';
export const TERMS_LS_KEY = '_parity-crowdsale::agreed-terms::v1';
export const CURRENT_STEP_LS_KEY = 'parity-crowdsale::current-step';

// Messages displays for 15s
const MESSAGE_TIMELIFE = 1000 * 15;

export const STEPS = {
  'important-notice': Symbol('important notice'),
  'start': Symbol('start'),
  'terms': Symbol('terms'),
  'country-selection': Symbol('country selection'),

  'account-selection': Symbol('account selection'),
  'load-account': Symbol('load account'),
  'unlock-account': Symbol('unlock account'),
  'create-account-password': Symbol('create-account-password'),
  'create-account-recovery': Symbol('create-account-recovery'),
  'create-account-repeat': Symbol('create-account-repeat'),
  'create-account-download': Symbol('create-account-download'),

  'picops-terms': Symbol('picops terms and conditions'),
  'picops-country-selection': Symbol('picops country selection'),
  'contribute': Symbol('contribute'),
  'payment': Symbol('payment'),
  'picops': Symbol('picops'),
  'fee-payment': Symbol('fee payment'),
  'purchase': Symbol('purchase'),
  'summary': Symbol('summary'),
  'late-uncertified': Symbol('late-uncertified')
};

let nextErrorId = 1;

class AppStore extends EventEmitter {
  blacklistedCountries = [];
  certifierAddress = null;
  loaders = {};

  skipCountrySelection = false;

  @observable loading = true;
  @observable messages = {};
  @observable step;
  @observable citizenAccepted = false;
  @observable spendingAccepted = false;
  @observable termsAccepted = false;

  constructor () {
    super();

    logger.info('loading the store');
    this.load();

    history.listen((location, haction) => {
      if (haction === 'REPLACE') {
        return;
      }

      // logger.warn('history event', location, haction);

      if (location.state && location.state.goto && !this.halted) {
        this.goto(location.state.goto);
      }

      if (this.historyCallback) {
        const cb = this.historyCallback.bind(this);

        delete this.historyCallback;
        cb();
      }
    });
  }

  load = async () => {
    try {
      await config.load();
      this.certifierAddress = await backend.certifierAddress();
      await this.loadCountries();
    } catch (error) {
      this.addError(error);
    }

    this.emit('loaded');
  };

  async goto (name) {
    if (!STEPS[name]) {
      logger.error(new Error(`unknown step ${name}`));
      return this.goto('important-notice');
    }

    this.setLoading(true);
    this.setStep(name);

    const { pathname, search, hash } = window.location;

    history.replace(`${pathname}${search}${hash}`, { goto: name });

    // Trigger the loaders and wait for them to return
    if (this.loaders[name]) {
      for (let loader of this.loaders[name]) {
        // A loader can return a truthy value to
        // skip further loadings
        const skip = await loader();

        if (skip) {
          return;
        }
      }
    }

    this.setLoading(false);
  }

  revertAndGo (name) {
    this.halted = true;

    this.historyCallback = () => {
      this.halted = false;
      history.push('/', { goto: name });
    };

    history.go((this.revertableSteps || 1) * -1);
  }

  async fetchBlacklistedCountries () {
    return Promise.resolve(['USA', 'CHN']);
  }

  async loadCountries () {
    const blCountries = await this.fetchBlacklistedCountries();

    this.blacklistedCountries = blCountries
      .filter((countryKey) => {
        if (!countries[countryKey]) {
          logger.error(new Error('unknown country key: ' + countryKey));
          return false;
        }

        return true;
      });

    const prevCountries = store.get(CITIZENSHIP_LS_KEY) || [];

    // The country selection can be skipped if the user
    // already said he was not from on of the
    // current blacklisted countries
    this.skipCountrySelection = difference(
      this.blacklistedCountries,
      prevCountries
    ).length === 0;
  }

  register (step, loader) {
    if (!STEPS[step]) {
      throw new Error(`unknown step ${step}`);
    }

    this.loaders[step] = (this.loaders[step] || []).concat(loader);
  }

  restart () {
    store.remove(CITIZENSHIP_LS_KEY);
    store.remove(TERMS_LS_KEY);

    this.termsAccepted = false;

    this.emit('restart');
    this.goto('start');
  }

  addError (error) {
    if (!error) {
      return;
    }

    // If it's not a client error, don't show it
    if (error.status && (error.status < 400 || error.status >= 500)) {
      return logger.error(error);
    }

    logger.error(error);
    return this.addMessage({ content: error.message, type: 'error', title: 'An error occured' });
  }

  @action addMessage ({ title, content, type }) {
    const id = nextErrorId++;

    this.messages = Object.assign({}, this.messages, { [id]: { title, content, type, id } });

    setTimeout(() => this.removeMessage(id), MESSAGE_TIMELIFE);

    return id;
  }

  @action removeMessage (id) {
    const messages = Object.assign({}, this.messages);

    if (messages[id]) {
      delete messages[id];
      this.messages = messages;
    }
  }

  @action setCitizenChecked (citizenAccepted) {
    this.citizenAccepted = citizenAccepted;
  }

  @action setLoading (loading) {
    this.loading = loading;
  }

  @action setSpendingChecked (spendingAccepted) {
    this.spendingAccepted = spendingAccepted;
  }

  @action setTermsAccepted (termsAccepted) {
    this.termsAccepted = termsAccepted;
  }

  @action setStep (name) {
    this.step = STEPS[name];
    this.stepName = name;
  }

  storeValidCitizenship () {
    const prevState = store.get(CITIZENSHIP_LS_KEY) || [];
    const nextState = uniq(prevState.concat(this.blacklistedCountries));

    store.set(CITIZENSHIP_LS_KEY, nextState);
  }

  storeTermsAccepted () {
    store.set(TERMS_LS_KEY, this.termsAccepted);
  }
}

const appStore = new AppStore();

export default appStore;
