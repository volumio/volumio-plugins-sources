import View from './View';

export default class ViewHelper {

  static getViewsFromUri(uri: string): View[] {
    const segments = uri.split('/');
    if (segments[0] !== 'youtube2') {
      return [];
    }

    const result: View[] = [];

    segments.forEach((segment, index) => {
      let view: View;
      if (index === 0) { // 'youtube2/...'
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

  static constructUriSegmentFromView<V extends View>(view: V) {
    let segment: string;
    if (view.name === 'root') {
      segment = 'youtube2';
    }
    else {
      segment = view.name;
    }

    const skip = [ 'name', 'noExplode' ];
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

    if (currentView.continuation) {
      const newView = { ...currentView };
      delete newView.continuation;
      delete newView.prevContinuations;

      if (currentView.prevContinuations) {
        const prevContinuations = [ ...currentView.prevContinuations ];
        const prevContinuation = prevContinuations.pop();
        if (prevContinuation && prevContinuations.length > 0) {
          newView.prevContinuations = prevContinuations;
        }
        if (prevContinuation) {
          newView.continuation = prevContinuation;
        }
      }

      if (!newView.continuation) {
        delete newView.continuationBundle;
      }

      segments.push(ViewHelper.constructUriSegmentFromView(newView));
    }

    return segments.join('/');
  }

  static constructUriFromViews(views: View[]) {
    const segments = views.map((view) => this.constructUriSegmentFromView(view));
    return segments.join('/');
  }
}
