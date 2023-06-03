'use strict';

const EndpointHelper = require('../helper/endpoint');
const { InnerTubeParser, InnerTubeBaseModel } = require('./innertube');

class RootModel extends InnerTubeBaseModel {

  async getContents(opts) {
    const innerTube = this.getInnerTube();
    const guide = await innerTube.getGuide();

    const sections = guide.contents.map((section) => this._expandGuideSection(section));

    const parsed = InnerTubeParser.parseResult({
      contents: sections
    });

    const primaryOnly = opts?.contentType === 'simple';
    parsed.sections = parsed.sections.reduce((filtered, section) => {
      const filteredSection = this._filterGuideEntries(section, primaryOnly);
      if (filteredSection) {
        filtered.push(filteredSection);
      }
      return filtered;
    }, []);

    return parsed;
  }

  _expandGuideSection(section) {
    const result = {
      type: section.type,
      title: section.title
    };

    result.items = section.items.reduce((expanded, entry) => {
      expanded.push(...this._expandGuideEntry(entry));
      return expanded;
    }, []);

    return result;
  }

  _expandGuideEntry(entry) {
    if (entry.type === 'GuideCollapsibleEntry') {
      return entry.expandable_items.reduce((expanded, item) => {
        expanded.push(...this._expandGuideEntry(item));
        return expanded;
      }, []);
    }
    if (entry.type === 'GuideCollapsibleSectionEntry') {
      return entry.section_items.reduce((expanded, item) => {
        expanded.push(...this._expandGuideEntry(item));
        return expanded;
      }, [...this._expandGuideEntry(entry.header_entry)]);
    }

    return [entry];
  }

  // 1. Filter out guide entries in given section with invalid endpoints
  // 2. If no entries left in section, return `null`
  _filterGuideEntries(section, primaryOnly = false) {
    const filteredItems = [];

    section.items.forEach((item) => {
      if (item.type === 'section') {
        const filterNestedResult = this._filterGuideEntries(item, primaryOnly);
        if (filterNestedResult) {
          filteredItems.push(filterNestedResult);
        }
      }
      else if ((primaryOnly ? item.isPrimary : true) && EndpointHelper.validate(item.endpoint)) {
        filteredItems.push(item);
      }
    });

    if (filteredItems.length > 0) {
      return {
        type: section.type,
        title: section.title,
        items: filteredItems
      };
    }    

    return null;
  }
}

module.exports = RootModel;
