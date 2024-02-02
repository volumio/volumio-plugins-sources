import BaseViewHandler from './BaseViewHandler';
import View from './View';
import ViewHelper from './ViewHelper';
import { CloudcastEntity } from '../../../entities/CloudcastEntity';
import UIHelper from '../../../util/UIHelper';
import { CloudcastView } from './CloudcastViewHandler';
import { LiveStreamEntity } from '../../../entities/LiveStreamEntity';
import { LiveStreamView } from './LiveStreamViewHandler';

export interface ExplodedTrackInfo {
  service: 'mixcloud';
  uri: string;
  albumart?: string;
  artist?: string;
  album?: string;
  name: string;
  title: string;
  duration?: number;
  samplerate?: string;
}

export type StreamableEntity = CloudcastEntity | LiveStreamEntity;

export default abstract class ExplodableViewHandler<V extends View> extends BaseViewHandler<V> {

  async explode(): Promise<ExplodedTrackInfo[]> {
    const view = this.currentView;
    if (view.noExplode) {
      return [];
    }

    const tracks = await this.getStreamableEntitiesOnExplode();
    if (!Array.isArray(tracks)) {
      const trackInfo = await this.convertStreamableEntityToExplodedTrackInfo(tracks);
      return trackInfo ? [ trackInfo ] : [];
    }

    const trackInfoPromises = tracks.map((track) => this.convertStreamableEntityToExplodedTrackInfo(track));
    return (await Promise.all(trackInfoPromises)).filter((song) => song) as ExplodedTrackInfo[];
  }

  protected async convertStreamableEntityToExplodedTrackInfo(entity: StreamableEntity): Promise<ExplodedTrackInfo | null> {
    switch (entity.type) {
      case 'cloudcast':
        return this.#convertCloudcastToExplodedTrackInfo(entity);
      case 'liveStream':
        return this.#convertLivestreamToExplodedTrackInfo(entity);
    }
  }

  protected abstract getStreamableEntitiesOnExplode(): Promise<StreamableEntity | StreamableEntity[]>;

  #convertCloudcastToExplodedTrackInfo(cloudcast: CloudcastEntity): ExplodedTrackInfo {
    // Track URI: mixcloud/cloudcast@cloudcastId={...}@owner={...}
    const cloudcastView: CloudcastView = {
      name: 'cloudcast',
      cloudcastId: cloudcast.id
    };
    if (cloudcast.owner?.username) {
      cloudcastView.owner = cloudcast.owner.username;
    }
    const trackUri = `mixcloud/${ViewHelper.constructUriSegmentFromView(cloudcastView)}`;

    const trackName = !cloudcast.isExclusive ? cloudcast.name : UIHelper.addExclusiveText(cloudcast.name);

    return {
      service: 'mixcloud',
      uri: trackUri,
      albumart: cloudcast.thumbnail,
      artist: cloudcast.owner?.name || cloudcast.owner?.username,
      album: '',
      name: trackName,
      title: trackName
    };
  }

  #convertLivestreamToExplodedTrackInfo(liveStream: LiveStreamEntity): ExplodedTrackInfo | null {
    if (!liveStream.owner) {
      return null;
    }

    // Track URI: mixcloud/livestream@username={...}
    const liveStreamView: LiveStreamView = {
      name: 'liveStream',
      username: liveStream.owner.username
    };
    const trackUri = `mixcloud/${ViewHelper.constructUriSegmentFromView(liveStreamView)}`;

    return {
      service: 'mixcloud',
      uri: trackUri,
      albumart: liveStream.thumbnail,
      artist: liveStream.owner.name || liveStream.owner.username,
      album: '',
      name: liveStream.name,
      title: liveStream.name
    };
  }
}
