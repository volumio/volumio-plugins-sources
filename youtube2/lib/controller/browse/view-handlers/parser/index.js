'use strict';

const ChannelParser = require('./channel');
const EndpointItemParser = require('./endpoint');
const OptionParser = require('./option');
const OptionValueParser = require('./option_value');
const PlaylistParser = require('./playlist');
const VideoParser = require('./video');

const typeToClass = {
  video: VideoParser,
  channel: ChannelParser,
  playlist: PlaylistParser,
  option: OptionParser,
  optionValue: OptionValueParser,
  endpoint: EndpointItemParser,
  guideEntry: EndpointItemParser
};

const getInstance = (type, uri, curView, prevViews) => {
  if (typeToClass[type]) {
    return new typeToClass[type](uri, curView, prevViews);
  }
  return null;
}

module.exports = {
  getInstance
};
