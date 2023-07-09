import { YTNodes, Helpers as YTHelpers } from 'volumio-youtubei.js';
import { BaseModel } from './BaseModel';
import InnertubeResultParser from './InnertubeResultParser';
import { ContentItem, PageElement } from '../types';
import EndpointHelper from '../util/EndpointHelper';
import { PageContent } from '../types/Content';

export default class RootModel extends BaseModel {

  async getContents(opts?: { contentType: 'simple' | 'full'}): Promise<PageContent | null> {
    const { innertube } = await this.getInnertube();
    const guide = await innertube.getGuide();
    const sections = guide.contents.map((section) => this.#expandGuideSection(section));
    const parsed = InnertubeResultParser.parseResult({ contents: sections });

    const primaryOnly = opts?.contentType === 'simple';
    if (parsed) {
      parsed.sections = parsed.sections.reduce<PageElement.Section[]>((filtered, section) => {
        const filteredSection = this.#filterGuideEntries(section, primaryOnly);
        if (filteredSection) {
          filtered.push(filteredSection);
        }
        return filtered;
      }, []);
    }

    return parsed;
  }

  #expandGuideSection(section: YTNodes.GuideSection | YTNodes.GuideSubscriptionsSection) {
    const sectionItems = section.items.reduce<YTHelpers.YTNode[]>((result, entry) => {
      result.push(...this.#expandGuideEntry(entry));
      return result;
    }, []);
    const result = {
      type: section.type,
      title: section.title,
      items: sectionItems
    };
    return result;
  }

  #expandGuideEntry(entry: YTHelpers.YTNode): YTHelpers.YTNode[] {
    if (entry instanceof YTNodes.GuideCollapsibleEntry) {
      const collapsibleEntry = entry as YTNodes.GuideCollapsibleEntry;
      return collapsibleEntry.expandable_items.reduce<YTHelpers.YTNode[]>((expanded, item) => {
        expanded.push(...this.#expandGuideEntry(item));
        return expanded;
      }, []);
    }
    if (entry instanceof YTNodes.GuideCollapsibleSectionEntry) {
      const sectionEntry = entry as YTNodes.GuideCollapsibleSectionEntry;
      const initialExpanded = sectionEntry.header_entry ? this.#expandGuideEntry(sectionEntry.header_entry) : [];
      return sectionEntry.section_items.reduce<YTHelpers.YTNode[]>((expanded, item) => {
        expanded.push(...this.#expandGuideEntry(item));
        return expanded;
      }, initialExpanded);
    }

    return [ entry ];
  }

  // 1. Filter out guide entries in given section with invalid endpoints
  // 2. If no entries left in section, return `null`
  #filterGuideEntries(section: PageElement.Section, primaryOnly = false): PageElement.Section | null {
    const filteredItems: (PageElement.Section | ContentItem.GuideEntry)[] = [];

    section.items.forEach((item) => {
      if (item.type === 'section') {
        const filterNestedResult = this.#filterGuideEntries(item, primaryOnly);
        if (filterNestedResult) {
          filteredItems.push(filterNestedResult);
        }
      }
      else if ((item.type === 'guideEntry' && primaryOnly ? item.isPrimary : true) && EndpointHelper.validate(item.endpoint)) {
        filteredItems.push(item as ContentItem.GuideEntry);
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
