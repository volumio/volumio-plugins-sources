'use strict';

const mixcloud = require(mixcloudPluginLibRoot + '/mixcloud');
const UIHelper = require(mixcloudPluginLibRoot + '/helper/ui');
const DiscoverViewHandler = require(__dirname + '/discover');

class FeaturedViewHandler extends DiscoverViewHandler {

    getListType() {
        return 'featured';
    }

    getTitle(selectedTags, orderBy, country) {
        let tagNames = selectedTags.map( t => t.name ).join(' &amp; ');
        let title = mixcloud.getI18n('MIXCLOUD_FEATURED_TITLE', tagNames);

        let view = this.getCurrentView();
        if (!view.inSection && selectedTags.length > 0) {
            let discoverLinkData = this.getSwitchViewLinkData(selectedTags);
            let discoverLink = this.constructGoToViewLink(discoverLinkData.text, discoverLinkData.uri);

            title = UIHelper.constructListTitleWithLink(title, discoverLink, true);
        }

        return title;
    }

    getSwitchViewLinkData(selectedTags) {
        // "View all { tag } shows"
        let tagNames = selectedTags.map( t => t.name ).join(' &amp; ');
        return {
            uri: this.getUri() + `/discover@slug=${selectedTags[0].slug}`,
            text: mixcloud.getI18n('MIXCLOUD_VIEW_ALL_SHOWS', tagNames)
        };
    }
}

module.exports = FeaturedViewHandler;