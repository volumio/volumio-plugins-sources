'use strict';

class ViewHelper {

  static getViewsFromUri(uri) {
    const result = [];

    const segments = uri.split('/');
    if (segments.length && segments[0] !== 'youtube2') {
      return result;
    }

    const splitSegment = (s) => {
      const result = {};
      const ss = s.split('@');
      ss.forEach((sss) => {
        const equalPos = sss.indexOf('=');
        if (equalPos < 0) {
          result.name = sss;
        }
        else {
          let key = sss.substr(0, equalPos);
          let value = sss.substr(equalPos + 1);

          if (value === this.NULL_VALUE_PLACEHOLDER) {
            value = null;
          }

          result[key] = value;
        }
      });

      return result;
    };

    segments.forEach((segment, index) => {
      let data;
      if (index === 0) { // 'youtube2/...'
        data = {
          name: 'root'
        };
      }
      else {
        data = splitSegment(segment);
      }
      result.push(data);
    });

    return result;
  }

  static filter(views, propertyValues) {
    return views.filter((view) => {
      for (const [prop, value] of Object.entries(propertyValues)) {
        if (view[prop] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  static constructUriFromViews(views) {
    const segments = [];

    views.forEach((view) => {
      segments.push(this.constructUriSegment(view));
    });

    return segments.join('/');
  }

  static constructUriSegment(view) {
    let segment;
    if (view.name === 'root') {
      segment = 'youtube2';
    }
    else {
      segment = view.name;
    }

    const skip = ['name', 'noExplode'];
    Object.keys(view).filter((key) => !skip.includes(key)).forEach((key) => {
      const v = view[key] !== null ? view[key] : ViewHelper.NULL_VALUE_PLACEHOLDER;
      segment += '@' + key + '=' + v;
    });

    return segment;
  }

  static constructPrevUri(curView, prevViews) {
    const segments = [];

    prevViews.forEach((view) => {
      segments.push(this.constructUriSegment(view));
    });

    const newView = { ...curView };
    if (curView.prevContinuations) {
      const prevContinuations = JSON.parse(decodeURIComponent(curView.prevContinuations));
      const prevContinuation = Array.isArray(prevContinuations) ? prevContinuations.pop() : null;
      let newPrevContinuations;
      if (prevContinuation && prevContinuations.length > 0) {
        newPrevContinuations = encodeURIComponent(JSON.stringify(prevContinuations));
      }
      else {
        newPrevContinuations = null;
      }
      if (newPrevContinuations) {
        newView.prevContinuations = newPrevContinuations;
        segments.push(this.constructUriSegment(newView));
      }
      else {
        delete newView.continuationBundle;
        segments.push(this.constructUriSegment(newView));
      }
    } else if (curView.continuation) {
      delete newView.continuation;
      segments.push(this.constructUriSegment(newView));
    }

    return segments.join('/') || '/';
  }

}

ViewHelper.NULL_VALUE_PLACEHOLDER = '###NULL###';

module.exports = ViewHelper;
