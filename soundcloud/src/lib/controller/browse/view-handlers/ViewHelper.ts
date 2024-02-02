import fs from 'fs';
import View from './View';

export default class ViewHelper {

  static getViewsFromUri(uri: string): View[] {
    const segments = uri.split('/');
    if (segments[0] !== 'soundcloud') {
      return [];
    }

    const result: View[] = [];

    segments.forEach((segment, index) => {
      let view: View;
      if (index === 0) { // 'soundcloud/...'
        view = {
          name: 'root'
        };
      }
      else {
        view = this.getViewFromUriSegment(segment);
      }
      result.push(view);
    });

    return result;
  }

  static constructUriSegmentFromView<V extends View>(view: V, keepFlags: boolean | Array<keyof typeof view> = false) {
    let segment: string;
    if (view.name === 'root') {
      segment = 'soundcloud';
    }
    else {
      segment = view.name;
    }

    const skip = [ 'name' ];
    const skipFlags = [ 'noExplode', 'combinedSearch', 'inSection' ];
    if (keepFlags) {
      if (Array.isArray(keepFlags)) {
        const newSkipFlags = skipFlags.filter((f) => !keepFlags.includes(f));
        skip.push(...newSkipFlags);
      }
    }
    else {
      skip.push(...skipFlags);
    }
    Object.keys(view).filter((key) => !skip.includes(key)).forEach((key) => {
      if (view[key] !== undefined) {
        if (typeof view[key] === 'object') {
          segment += `@${key}:o=${encodeURIComponent(JSON.stringify(view[key]))}`;
        }
        else {
          segment += `@${key}=${encodeURIComponent(view[key])}`;
        }
      }
    });

    return segment;
  }

  static getViewFromUriSegment(segment: string): View {
    const result: View = {
      name: ''
    };
    segment.split('@').forEach((s) => {
      const equalIndex = s.indexOf('=');
      if (equalIndex < 0) {
        result.name = s;
      }
      else {
        let key = s.substring(0, equalIndex);
        let value = decodeURIComponent(s.substring(equalIndex + 1));

        if (key.endsWith(':o')) { // `value` is object
          key = key.substring(0, key.length - 2);
          value = JSON.parse(value);
        }

        result[key] = value;
      }
    });

    return result;
  }

  static constructPrevUri(currentView: View, previousViews: View[]) {
    const segments = previousViews.map(((view) => ViewHelper.constructUriSegmentFromView(view)));

    if (currentView.pageRef) {
      const newView = { ...currentView };
      delete newView.pageRef;
      delete newView.prevPageRefs;

      if (currentView.prevPageRefs) {
        const prevPageRefs = [ ...currentView.prevPageRefs ];
        const prevPageRef = prevPageRefs.pop();
        if (prevPageRef && prevPageRefs.length > 0) {
          newView.prevPageRefs = prevPageRefs;
        }
        if (prevPageRef) {
          newView.pageRef = prevPageRef;
        }
      }

      segments.push(ViewHelper.constructUriSegmentFromView(newView));
    }

    return segments.join('/');
  }

  static constructUriFromViews(views: View[]) {
    const segments = views.map((view) => this.constructUriSegmentFromView(view));
    return segments.join('/');
  }

  static supportsEnhancedTitles() {
    return !this.isManifestUI();
  }

  static isManifestUI() {
    const volumioManifestUIDir = '/volumio/http/www4';
    const volumioManifestUIDisabledFile = '/data/disableManifestUI';
    return fs.existsSync(volumioManifestUIDir) && !fs.existsSync(volumioManifestUIDisabledFile);
  }
}
