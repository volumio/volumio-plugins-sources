import * as InnertubeLib from 'volumio-youtubei.js';
import { I18nOptions, I18nOptionValue, InnertubeInstance } from './common';

type Predicate = (k: string, v: any) => boolean;

export async function getI18nOptions(): Promise<I18nOptions> {
  const menus = await fetchAccountMenu();
  const languageMenu = findInObject(menus, createPredicate('selectLanguageCommand', 'hl'))?.[0];
  const regionMenu = findInObject(menus, createPredicate('selectCountryCommand', 'gl'))?.[0];

  const result: I18nOptions = {};

  if (languageMenu) {
    const languageOptionValues = getOptionsValuesFromMenu(languageMenu, 'selectLanguageCommand', 'hl');
    if (languageOptionValues) {
      result.language = languageOptionValues;
    }
  }

  if (regionMenu) {
    const regionOptionValues = getOptionsValuesFromMenu(regionMenu, 'selectCountryCommand', 'gl');
    if (regionOptionValues) {
      result.region = regionOptionValues;
    }
  }

  return result;
}

async function fetchAccountMenu(): Promise<object> {
  const innerTube = await InnertubeInstance.get();

  const requestPayload = {
    client: 'WEB'
  };

  const response = await innerTube.session.http.fetch('/account/account_menu', {
    method: 'POST',
    body: JSON.stringify(requestPayload),
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return JSON.parse(await response.text());
}

function createPredicate(targetSelectCommandKey: string, targetCodeProp: string): Predicate {
  return (key: string, value: object) => {
    // Match is true if:
    // 1. property is identified by `key` = 'multiPageMenuRenderer'; and
    // 2. somewhere in the nested properties of `value`, there exists `targetSelectCommandKey` which itself has the property `targetCodeProp`
    // We use a second predicate for testing condition 2.

    const secondaryPredicate: Predicate = (k: string, v: Record<string, any>) => {
      return (k === targetSelectCommandKey && v[targetCodeProp]);
    };

    return key === 'multiPageMenuRenderer' && findInObject(value, secondaryPredicate).length > 0;
  };
}

function getOptionsValuesFromMenu(contents: any, targetSelectCommandKey: string, targetCodeProp: string): I18nOptionValue[] {
  const menuItems = findInObject(contents, (key, value) => {
    return key === 'compactLinkRenderer' && value.serviceEndpoint?.signalServiceEndpoint?.actions?.find((action: Record<string, any>) => action[targetSelectCommandKey]);
  });

  return menuItems.reduce<I18nOptionValue[]>((ov, item: any) => {
    const label = new InnertubeLib.Misc.Text(item.title).toString();
    const value = new InnertubeLib.YTNodes.NavigationEndpoint(item.serviceEndpoint)?.payload?.actions?.find(
      (action: Record<string, any>) => action[targetSelectCommandKey])?.[targetSelectCommandKey]?.[targetCodeProp];

    if (label && value) {
      ov.push({ label, value });
    }

    return ov;
  }, []);
}

/**
 * Recursively match each property of `obj` against `predicate` and returns the values of matches.
 * @param {*} obj
 * @param {*} predicate `function(key, value)`
 * @returns List of values of matched properties. Only deepest matches are included.
 */
function findInObject(obj: object, predicate: Predicate): any[] {
  const matches: any[] = [];
  if (typeof obj === 'object') {
    for (const [ key, value ] of Object.entries(obj)) {
      let lastMatch: any;
      if (predicate(key, value)) {
        lastMatch = value;
      }
      if (typeof value === 'object') {
        const nestedMatches = findInObject(value, predicate);
        // If there are nested objects that match predicate, then add those instead
        // Of parent match (i.e. `lastMatch`, if any).
        if (nestedMatches.length > 0) {
          matches.push(...nestedMatches);
        }
        else if (lastMatch) {
          matches.push(lastMatch);
        }
      }
      else if (lastMatch) {
        matches.push(lastMatch);
      }
    }
  }
  else if (Array.isArray(obj)) {
    for (const value of obj as any[]) {
      matches.push(...findInObject(value, predicate));
    }
  }
  return matches;
}
