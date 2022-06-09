'use strict';

const yt2 = require(yt2PluginLibRoot + '/youtube2');

class UIConfigHelper {

    static sortFrontPageSections(sections) {
        if (sections.length > 1) {
            sections.sort( (a, b) => {
                if (a.sortOrder !== b.sortOrder) {
                    return a.sortOrder < b.sortOrder ? -1 : 1;
                }
                return a.title.localeCompare(b.title);
            })
        }
    }

    static constructFrontPageSections(sections) {
        let self = this;

        let uiConfigSections = [];
        sections.forEach( (section, index) => {
            uiConfigSections.push(self._constructFrontPageSection(section, index));
        });

        return uiConfigSections;
    }

    static _constructFrontPageSection(section, index) {
        let uiConfigSection = {
            id: 'section_front_page_section',
            element: 'section',
            label: yt2.getI18n('YOUTUBE2_FRONT_PAGE_SECTION', section.title),
            icon: 'fa-window-maximize',
            onSave: {
                type: 'controller',
                endpoint: 'music_service/youtube2',
                method: 'configUpdateFrontPageSection'
            },
            saveButton: {
                label: yt2.getI18n('YOUTUBE2_UPDATE'),
                data: [
                    'index',
                    'enabled',
                    'title',
                    'sortOrder',
                    'itemType',
                    'keywords',
                    'itemCount'
                ]
            },
            content: [
                {
                    id: 'enabled',
                    element: 'switch',
                    label: yt2.getI18n('YOUTUBE2_ENABLED'),
                    value: section.enabled ? true : false
                },
                {
                    id: 'title',
                    type: 'text',
                    element: 'input',
                    label: yt2.getI18n('YOUTUBE2_TITLE'),
                    value: section.title
                },
                {
                    id: 'sortOrder',
                    type: 'number',
                    element: 'input',
                    label: yt2.getI18n('YOUTUBE2_SORT_ORDER'),
                    value: section.sortOrder
                },
                {
                    id: 'itemType',
                    element: 'select',
                    label: yt2.getI18n('YOUTUBE2_ITEM_TYPE'),
                    value: {
                        value: section.itemType,
                        label: section.itemType === 'channel' ? yt2.getI18n('YOUTUBE2_CHANNEL') : (section.itemType === 'playlist' ? yt2.getI18n('YOUTUBE2_PLAYLIST') : yt2.getI18n('YOUTUBE2_VIDEO'))
                    },
                    options: [
                        {
                            value: 'channel',
                            label: yt2.getI18n('YOUTUBE2_CHANNEL')
                        },
                        {
                            value: 'playlist',
                            label: yt2.getI18n('YOUTUBE2_PLAYLIST')
                        },
                        {
                            value: 'video',
                            label: yt2.getI18n('YOUTUBE2_VIDEO')
                        }
                    ]
                },
                {
                    id: 'keywords',
                    type: 'text',
                    element: 'input',
                    label: yt2.getI18n('YOUTUBE2_KEYWORDS'),
                    value: section.keywords
                },
                {
                    id: 'itemCount',
                    type: 'number',
                    element: 'input',
                    label: yt2.getI18n('YOUTUBE2_ITEM_COUNT'),
                    value: section.itemCount
                },
                {
                    id: 'removeSection',
                    element: 'button',
                    label: yt2.getI18n('YOUTUBE2_REMOVE_SECTION'),
                    onClick: {
                        type: 'emit',
                        message: 'callMethod',
                        data: {
                            endpoint: 'music_service/youtube2',
                            method: 'configRemoveFrontPageSection',
                            data: index
                        }
                    }
                },
                {
                    id: 'index',
                    type: 'number',
                    element: 'input',
                    value: index,
                    visibleIf: {
                        field: 'itemType',
                        value: 'bogus'
                    }
                }
            ]
        }

        return uiConfigSection;
    }

    static getLanguageOptions() {
        if (!this.languageOptions) {
            let raw = require(yt2PluginLibRoot + '/../assets/languages.json');
            let options = [];
            raw.items.forEach( (item) => {
                options.push({
                    value: item.snippet.hl,
                    label: item.snippet.name
                });
            });
            this.languageOptions = options;
        }

        let configValue = yt2.getConfigValue('language', 'en');
        let selected = this.languageOptions.find( option => option.value === configValue );

        return {
            options: this.languageOptions,
            selected: selected
        };
    }

    static getRegionOptions() {
        if (!this.regionOptions) {
            let raw = require(yt2PluginLibRoot + '/../assets/regions.json');
            let options = [];
            raw.items.forEach( (item) => {
                options.push({
                    value: item.snippet.gl,
                    label: item.snippet.name
                });
            });
            this.regionOptions = options;
        }

        let configValue = yt2.getConfigValue('region', 'US');
        let selected = this.regionOptions.find( option => option.value === configValue );

        return {
            options: this.regionOptions,
            selected: selected
        };
    }
}

module.exports = UIConfigHelper;