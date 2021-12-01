'use strict';

const libQ = require('kew');
const UIHelper = require(mixcloudPluginLibRoot + '/helper/ui');
const ViewHelper = require(mixcloudPluginLibRoot + '/helper/view');
const Model = require(mixcloudPluginLibRoot + '/model')
const Parser = require(__dirname + '/parser');

class BaseViewHandler {

    constructor(curView, prevViews) {
        this._curView = curView;
        this._prevViews = prevViews;
        this._models = {};
        this._parsers = {};
    }

    browse() {
        return libQ.resolve([]);
    }

    explode() {
        return libQ.reject("Operation not supported");
    }

    getUri() {
        if (!this._uri) {
            this._uri = this.constructCurrentUri();
        }
        return this._uri;
    }

    getCurrentView() {
        return this._curView;
    }

    getPreviousViews() {
        return this._prevViews;
    }

    getModel(type) {
        if (this._models[type] == undefined) {
            this._models[type] = Model.getInstance(type);
        }
        return this._models[type];
    }

    getParser(type) {
        if (this._parsers[type] == undefined) {
            this._parsers[type] = Parser.getInstance(type, this.getUri(), this.getCurrentView(), this.getPreviousViews());
        }
        return this._parsers[type];
    }

    constructPageRef(pageToken, pageOffset) {
        if (!pageToken && !pageOffset) {
            return null;
        }
        let ref = {
            pageToken: pageToken || '',
            pageOffset: pageOffset || 0
        };
        return encodeURIComponent(JSON.stringify(ref));
    }

    parsePageRef(pageRef) {
        let parsed = JSON.parse(decodeURIComponent(pageRef));
        return {
            pageToken: parsed && parsed.pageToken ? parsed.pageToken : null,
            pageOffset: parsed && parsed.pageOffset ? parsed.pageOffset : 0
        };
    }

    constructUriFromViews(views) {
        let segments = [];
        
        views.forEach( view => {
            segments.push(this._constructUriSegment(view));
        });

        return segments.join('/');
    }

    constructCurrentUri() {
        return this.constructUriFromViews(this.getPreviousViews().concat(this.getCurrentView()));
    }

    constructPrevUri() {
        let curView = this.getCurrentView();
        let prevViews = this.getPreviousViews();
       
        let segments = [];
        
        prevViews.forEach( view => {
            segments.push(this._constructUriSegment(view));
        });
        
        if (curView.prevPageRefs) {
            let prevPageRefs = JSON.parse(decodeURIComponent(curView.prevPageRefs));
            let prevPageRef = Array.isArray(prevPageRefs) ? prevPageRefs.pop() : null;
            let newPrevPageRefs;
            if (prevPageRef && prevPageRefs.length) {
                newPrevPageRefs = encodeURIComponent(JSON.stringify(prevPageRefs));
            }
            else {
                newPrevPageRefs = null;
            }
            if (prevPageRef) {
                segments.push(this._constructUriSegment(curView, prevPageRef, newPrevPageRefs));
            }
        } else if (curView.pageRef) {
            segments.push(this._constructUriSegment(curView, null, null, null));
        }

        return segments.join('/');
    }

    constructNextUri(nextPageRef) {
        let curView = this.getCurrentView();
        let prevViews = this.getPreviousViews();
       
        let segments = [];
        
        prevViews.forEach( view => {
            segments.push(this._constructUriSegment(view));
        });

        let prevPageRefs = curView.prevPageRefs ? JSON.parse(decodeURIComponent(curView.prevPageRefs)) : [];
        if (!Array.isArray(prevPageRefs)) {
            prevPageRefs = [];
        }
        if (curView.pageRef) {
            prevPageRefs.push(curView.pageRef);
        }
        if (prevPageRefs.length) {
            prevPageRefs = encodeURIComponent(JSON.stringify(prevPageRefs));
        }
        else {
            prevPageRefs = null;
        }
        segments.push(this._constructUriSegment(curView, nextPageRef, prevPageRefs));

        return segments.join('/');
    }

    _constructUriSegment(view, replacePageRef, replacePrevPageRefs) {

        let segment;
        if (view.name === 'root') {
            segment = 'mixcloud';
        }
        else {
            segment = view.name;
        }

        let skip = ['name', 'pageRef', 'prevPageRefs', 'noExplode', 'inSection'];
        Object.keys(view).filter( key => !skip.includes(key) ).forEach( key => {
            let v = view[key] !== null ? view[key] : ViewHelper.NULL_VALUE_PLACEHOLDER;
            segment += '@' + key + '=' + v;
        });

        if (replacePageRef) {
            segment += '@pageRef=' + replacePageRef;
        }
        else if (replacePageRef === undefined && view.pageRef) {
            segment += '@pageRef=' + view.pageRef;
        }

        if (replacePrevPageRefs) {
            segment += '@prevPageRefs=' + replacePrevPageRefs;
        }
        else if (replacePrevPageRefs === undefined && view.prevPageRefs) {
            segment += '@prevPageRefs=' + view.prevPageRefs;
        }

        return segment;
    }

    constructNextPageItem(nextUri, title) {
        if (!title) {
            title = UIHelper.getMoreText();
        }
        let data = {
            service: 'mixcloud',
            type: 'mixcloudNextPageItem',
            'title': title,
            'uri': nextUri + '@noExplode=1',
            'icon': 'fa fa-arrow-circle-right'
        }
        return data;
    }

    constructUriWithParams(params) {
        let prevViews = this.getPreviousViews();
        let curView = Object.assign({}, this.getCurrentView(), params);

        return this.constructUriFromViews(prevViews.concat(curView));
    }

    constructPrevViewLink(text) {
        let backUri = this.constructUriFromViews(this.getPreviousViews());
        let icon = {
            type: 'fa',
            class: 'fa fa-arrow-circle-left',
            color: '#54c688'
        };
        return UIHelper.constructBrowsePageLink(
            text,
            backUri,
            icon
        );
    }

    constructGoToViewLink(text, uri) {
        let icon = {
            type: 'fa',
            class: 'fa fa-arrow-circle-right',
            float: 'right',
            color: '#54c688'
        };
        return UIHelper.constructBrowsePageLink(
            text,
            uri,
            icon
        );
    }

}

module.exports = BaseViewHandler