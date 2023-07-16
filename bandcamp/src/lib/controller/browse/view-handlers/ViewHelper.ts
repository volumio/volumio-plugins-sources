import View from './View';

export default class ViewHelper {

  static getViewsFromUri(uri: string): View[] {
    const segments = uri.split('/');
    if (segments[0] !== 'bandcamp') {
      return [];
    }

    const result: View[] = [];

    segments.forEach((segment, index) => {
      let view: View;
      if (index === 0) { // 'bandcamp/...'
        view = {
          name: 'root'
        };
      }
      else {
        view = this.#getViewFromUriSegment(segment);
      }
      result.push(view);
    });

    return result;
  }

  static constructUriSegmentFromView<V extends View>(view: V) {
    let segment: string;
    if (view.name === 'root') {
      segment = 'bandcamp';
    }
    else {
      segment = view.name;
    }

    const skip = [ 'name', 'pageRef', 'prevPageRefs', 'noExplode', 'combinedSearch', 'inSection' ];
    Object.keys(view).filter((key) => !skip.includes(key)).forEach((key) => {
      if (view[key] !== undefined) {
        segment += `@${key}=${encodeURIComponent(view[key])}`;
      }
    });

    if (view.prevPageRefs) {
      segment += `@$prevPageRefs=${encodeURIComponent(JSON.stringify(view.prevPageRefs))}`;
    }

    if (view.pageRef) {
      segment += `@pageRef=${encodeURIComponent(JSON.stringify(view.pageRef))}`;
    }

    return segment;
  }

  static #getViewFromUriSegment(segment: string): View {
    const result: View = {
      name: '',
      startIndex: 0
    };
    segment.split('@').forEach((s) => {
      const equalIndex = s.indexOf('=');
      if (equalIndex < 0) {
        result.name = s;
      }
      else {
        const key = s.substring(0, equalIndex);
        const value = s.substring(equalIndex + 1);
        if (key === 'pageRef' || key === 'prevPageRefs') {
          result[key] = JSON.parse(decodeURIComponent(value));
        }
        else {
          result[key] = decodeURIComponent(value);
        }
      }
    });

    return result;
  }

  static constructUriFromViews(views: View[]) {
    const segments = views.map((view) => this.constructUriSegmentFromView(view));
    return segments.join('/');
  }
}
