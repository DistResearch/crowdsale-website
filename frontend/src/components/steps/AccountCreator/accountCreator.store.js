import { phraseToWallet } from '@parity/ethkey.js';
import { randomPhrase } from '@parity/wordlist';
import FileSaver from 'file-saver';
import { action, observable } from 'mobx';

import appStore from '../../../stores/app.store';
import accountStore from '../../../stores/account.store';
import { createWallet } from '../../../utils';

class AccountCreatorStore {
  @observable password = '';

  address = null;
  phrase = null;
  secret = null;

  createWallet () {
    this._createWallet().catch((error) => {
      appStore.addError(error);
    });
  }

  async _createWallet () {
    const { password, secret } = this;
    const jsonWallet = await createWallet(secret, password);

    accountStore.setJSONWallet(jsonWallet);
  }

  generateWallet () {
    this._generateWallet().catch((error) => {
      appStore.addError(error);
    });
  }

  async _generateWallet () {
    const phrase = randomPhrase(12);
    const { address, secret } = await phraseToWallet(phrase);

    this.address = address;
    this.phrase = phrase;
    this.secret = secret;

    accountStore.setJSONWallet(null);
  }

  downloadWallet () {
    this._downloadWallet().catch((error) => {
      appStore.addError(error);
    });
  }

  async _downloadWallet () {
    if (!accountStore.jsonWallet) {
      await this._createWallet();
    }

    const { jsonWallet } = accountStore;
    const blob = new Blob([JSON.stringify(jsonWallet)], { type: 'text/json;charset=utf-8' });

    FileSaver.saveAs(blob, `${jsonWallet.id}.json`);
  }

  @action setPassword (password) {
    this.password = password;
  }
}

export default new AccountCreatorStore();
