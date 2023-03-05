'use strict';

const AlbumParser = require(__dirname + '/album');
const SongParser = require(__dirname + '/song');
const VideoParser = require(__dirname + '/video');
const ArtistParser = require(__dirname + '/artist');
const PlaylistParser = require(__dirname + '/playlist');
const MoreItemParser = require(__dirname + '/more_item');
const EndpointItemParser = require(__dirname + '/endpoint');
const OptionParser = require(__dirname + '/option');
const OptionValueParser = require(__dirname + '/option_value');
const LibraryArtistParser = require(__dirname + '/library_artist');

const typeToClass = {
  album: AlbumParser,
  song: SongParser,
  video: VideoParser,
  artist: ArtistParser,
  playlist: PlaylistParser,
  moreItem: MoreItemParser,
  endpoint: EndpointItemParser,
  option: OptionParser,
  optionValue: OptionValueParser,
  libraryArtist: LibraryArtistParser,
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
