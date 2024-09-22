import Innertube from 'volumio-youtubei.js';

export interface I18nOptionValue {
  label: string;
  value: string;
}

export interface I18nOptions {
  region?: I18nOptionValue[];
  language?: I18nOptionValue[];
}

export const DEFAULT_I18N_OPTIONS: I18nOptions = {
  region: [ { label: 'United States', value: 'US' } ],
  language: [ { label: 'English (US)', value: 'en' } ]
};

export class InnertubeInstance {
  static #instance: Innertube;

  static async get(): Promise<Innertube> {
    if (!InnertubeInstance.#instance) {
      InnertubeInstance.#instance = await Innertube.create();
    }

    return InnertubeInstance.#instance;
  }
}
