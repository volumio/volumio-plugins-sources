import Endpoint from './Endpoint';

export interface I18nOptions {
  language?: {
    label: string;
    optionValues: I18nOptionValue[];
  };
  region?: {
    label: string;
    optionValues: I18nOptionValue[];
  }
}

export interface I18nOptionValue {
  label: string;
  value: string;
}

export interface Account {
  name: string;
  photo: string | null;
  channel?: {
    title: string;
    endpoint: Endpoint | null;
  };
}
