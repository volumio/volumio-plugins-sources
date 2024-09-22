import { ObservedUIConfig, ObservedUIConfigSection, ObservedUIConfigSectionContent, UIConfig, UIConfigSection } from './UIConfig';
import { UIConfigSectionKey } from './UIConfigSchema';

export default class UIConfigHelper {

  static observe(data: UIConfig): ObservedUIConfig {
    const observedSections: Record<string | symbol, any> = {};
    return new Proxy(data, {
      get: (target, prop) => {
        if (observedSections[prop]) {
          return observedSections[prop];
        }
        const section = target.sections.find((s) => s.id === prop);
        if (section) {
          const observed = this.#observeSection(section);
          observedSections[prop] = observed;
          return observed;
        }

        return Reflect.get(target, prop);
      },
      set: (target, prop, value) => {
        if (observedSections[prop]) {
          delete observedSections[prop];
        }
        return Reflect.set(target, prop, value);
      },
      deleteProperty: (target, prop) => {
        if (observedSections[prop]) {
          delete observedSections[prop];
        }
        return Reflect.deleteProperty(target, prop);
      }
    }) as ObservedUIConfig;
  }

  static #observeSection<K extends UIConfigSectionKey>(data: UIConfigSection<K>): ObservedUIConfigSection<K> {
    if (!data.content) {
      data.content = [];
    }
    let observedContent = this.#observeSectionContent(data.content);
    return new Proxy(data, {
      get: (target, prop) => {
        if (prop === 'content') {
          return observedContent;
        }

        return Reflect.get(target, prop);
      },
      set: (target, prop, value) => {
        if (prop === 'content') {
          observedContent = this.#observeSectionContent(value);
        }
        return Reflect.set(target, prop, value);
      }
    }) as ObservedUIConfigSection<K>;
  }

  static #observeSectionContent<K extends UIConfigSectionKey>(data: NonNullable<UIConfigSection<K>['content']>): ObservedUIConfigSectionContent<K> {
    return new Proxy(data, {
      get: (target, prop) => {
        return data.find((c) => c.id === prop) || Reflect.get(target, prop);
      }
    }) as ObservedUIConfigSectionContent<K>;
  }

  static sanitizeNumberInput(value: any): number | '' {
    if (typeof value === 'number') {
      return value;
    }
    if (value === null || value === undefined || value === '') {
      return '';
    }
    return Number(value) || '';
  }
}
