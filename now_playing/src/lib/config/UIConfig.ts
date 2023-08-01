import { UIConfigElementOf, UIConfigSectionContentKeyOf, UIConfigSectionKey } from './UIConfigSchema';

export interface UIConfig {
  page: {
    label?: string;
  },
  sections: UIConfigSection<UIConfigSectionKey>[]
}

export type UIConfigElementType = 'input' | 'button' | 'select' | 'switch';
export type UIConfigInputType = 'text' | 'number' | 'color';

export interface UIConfigElementBase<K extends UIConfigSectionKey> {
  id: UIConfigSectionContentKeyOf<K>;
  element: UIConfigElementType;
  label: string;
  doc?: string;
  attributes?: Record<string, string>[];
  visibleIf? : {
    field: UIConfigSectionContentKeyOf<K>;
    value: string | number | boolean;
  }
}

export type UIConfigElement<K extends UIConfigSectionKey> =
                              UIConfigInput<K, UIConfigInputType> |
                              UIConfigSelect<K> |
                              UIConfigButton<K> |
                              UIConfigSwitch<K> |
                              any;

export interface UIConfigSection<K extends UIConfigSectionKey> {
  id: K;
  element: 'section';
  label?: string;
  description?: string;
  icon?: string;
  onSave?: {
    type: string;
    endpoint: string;
    method: string;
  };
  saveButton?: {
    label: string;
    data: UIConfigSectionContentKeyOf<K>[];
  };
  content?: UIConfigElement<K>[];
}

export interface UIConfigInput<K extends UIConfigSectionKey, T extends UIConfigInputType> extends UIConfigElementBase<K> {
  element: 'input',
  type: T;
  value: T extends 'number' ? number | '' :
         T extends 'color' ? string :
         string;
}

export interface UIConfigSelect<K extends UIConfigSectionKey> extends UIConfigElementBase<K> {
  element: 'select';
  doc?: string;
  value: {
    value: string;
    label: string;
  };
  options: {
    value: string;
    label: string;
  }[];
}

export interface UIConfigButton<K extends UIConfigSectionKey> extends UIConfigElementBase<K> {
  element: 'button';
  onClick: {
    type: 'emit';
    message: 'callMethod';
    data: {
      endpoint: string;
      method: string;
      data?: any;
    };
  } | {
    type: 'openUrl';
    url: string;
  };
}

export interface UIConfigSwitch<K extends UIConfigSectionKey> extends UIConfigElementBase<K> {
  element: 'switch';
  value: boolean;
}

export type ObservedUIConfig = UIConfig & {
  [K in UIConfigSectionKey]: ObservedUIConfigSection<K>;
}

export type ObservedUIConfigSection<K extends UIConfigSectionKey> = UIConfigSection<K> & {
  content: ObservedUIConfigSectionContent<K>;
}

export type ObservedUIConfigSectionContent<K extends UIConfigSectionKey> = UIConfigSection<K>['content'] & {
  [C in UIConfigSectionContentKeyOf<K>]: UIConfigElementOf<K, C>;
}
