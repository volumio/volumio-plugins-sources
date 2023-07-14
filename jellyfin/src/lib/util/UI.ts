import { existsSync } from 'fs';

export default class UI {
  static supportsEnhancedTitles(): boolean {
    return !this.isManifestUI();
  }

  static isManifestUI(): boolean {
    const volumioManifestUIDir = '/volumio/http/www4';
    const volumioManifestUIDisabledFile = '/data/disableManifestUI';
    return existsSync(volumioManifestUIDir) && !existsSync(volumioManifestUIDisabledFile);
  }

  static createLink(data: { text: string, uri: string }): string {
    const onclick = `angular.element('#browse-page').scope().browse.fetchLibrary({uri: '${data.uri}'})`;
    return `<a href="#" onclick="${onclick}">${data.text}</a>`;
  }
}
