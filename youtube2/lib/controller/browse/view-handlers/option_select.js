'use strict';

const BaseViewHandler = require('./base');

class OptionSelectionViewHandler extends BaseViewHandler {

  async browse() {
    const listData = this._getListData();
    const lists = [
      {
        title: listData.title,
        availableListViews: ['list'],
        items: listData.items
      }
    ];

    const nav = {
      prev: {
        uri: this.constructPrevUri()
      },
      lists
    };

    return { navigation: nav };
  }

  _getListData() {

    const view = this.getCurrentView();
    const parser = this.getParser('optionValue');

    let option, listItems;

    if (view.fromContinuationBundle) {

      const bundle = JSON.parse(decodeURIComponent(view.continuationBundle));
      const workBundle = JSON.parse(decodeURIComponent(view.continuationBundle));
      const targetKeys = decodeURIComponent(view.target).split('.');

      const __setSelected = (option, index) => {
        option.optionValues.forEach((ov, i) => {
          option.optionValues[i].selected = (i === index)
        });
      };

      const __getTargetOption = (_bundle) => {
        return targetKeys.reduce((targetValue, key) => targetValue[key], _bundle);
      }

      option = __getTargetOption(bundle);
      listItems = option.optionValues.reduce((parsed, data, index) => {
        let extraUriParams;
        if (data.endpoint?.type === 'browseContinuation' || data.endpoint?.type === 'searchContinuation') {
          const workOption = __getTargetOption(workBundle);
          __setSelected(workOption, index);
          extraUriParams = {
            continuationBundle: workBundle
          };
        }
        const listItem = parser.parseToListItem(data, { extraUriParams });
        if (listItem) {
          parsed.push(listItem);
        }
        return parsed;
      }, []);
    }
    else {
      option = JSON.parse(decodeURIComponent(view.option));
      listItems = option.optionValues.reduce((parsed, data) => {
        const listItem = parser.parseToListItem(data);
        if (listItem) {
          parsed.push(listItem);
        }
        return parsed;
      }, []);
    }

    return {
      title: option.title,
      items: listItems
    };

  }
}

module.exports = OptionSelectionViewHandler;
