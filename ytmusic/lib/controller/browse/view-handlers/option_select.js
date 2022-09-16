'use strict';

const libQ = require('kew');
const BaseViewHandler = require(__dirname + '/base');

class OptionSelectionViewHandler extends BaseViewHandler {

  browse() {
    const view = this.getCurrentView();
    const option = JSON.parse(decodeURIComponent(view.option));
    const parser = this.getParser('optionValue');

    // Base uri
    const baseUriViews = [...this.getPreviousViews()];
    baseUriViews.pop();
    const baseUri = this.constructUriFromViews(baseUriViews) || 'ytmusic';
    const prevUri = this.constructPrevUri();

    const lists = [];
    const optionValues = option.optionValues.reduce((parsed, data) => {
      const listItem = parser.parseToListItem(data, baseUri, prevUri);
      if (listItem) {
        parsed.push(listItem);
      }
      return parsed;
    }, []);

    lists.push({
      title: option.label,
      availableListViews: ['list'],
      items: optionValues
    });

    const nav = {
      prev: {
        uri: prevUri
      },
      lists
    };

    return libQ.resolve({ navigation: nav });
  }
}

module.exports = OptionSelectionViewHandler;
