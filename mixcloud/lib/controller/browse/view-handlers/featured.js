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
            let discoverUri = this.getUri() + `/discover@slug=${selectedTags[0].slug}`;
            let discoverLink = this.constructGoToViewLink(mixcloud.getI18n('MIXCLOUD_VIEW_ALL_SHOWS', tagNames), discoverUri);

            title = UIHelper.constructListTitleWithLink(title, discoverLink, true);
        }

        return title;
    }
}

module.exports = FeaturedViewHandler;