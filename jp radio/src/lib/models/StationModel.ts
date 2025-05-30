/** ラジオ局の基本情報 */
export interface RadioStationItem {
  // ex: 'webradio'
  service: string;
  // ex: 'song'
  type: string;
  // 局タイトル（例：北海道 / HBC RADIO - 番組名）
  title: string;
  // 画像URL（空文字列も許容）
  albumart: string;
  // 再生URI
  uri: string;
  // 空文字列など追加情報用
  name: string;
  // 空文字列など追加情報用
  samplerate: string;
  // 0 など追加情報用
  bitdepth: number;
  // 0 など追加情報用
  channels: number;
}

/** Browse用の項目。RadioStationItemを継承しつつ、uriにタイムスタンプを付与したものを想定 */
export interface BrowseItem extends RadioStationItem {
  // 例えば `http://localhost:3000/radiko/HBC?ts=1234567890`
  uri: string;
}

/** ブラウズリスト */
export interface BrowseList {
  // 例: 'LIVE' や '北海道・東北'
  title: string;
  // 例: ['grid', 'list']
  availableListViews: string[];
  // 表示する局リスト
  items: BrowseItem[];
}

/** ナビゲーション情報 */
export interface BrowseNavigation {
  lists: BrowseList[];
  // 前のページURIがあれば
  prev?: { uri: string };
}

/** ブラウズ結果の最上位 */
export interface BrowseResult {
  // 現在のURI（例: 'radiko?ts=1234567890'）
  uri: string;
  navigation: BrowseNavigation;
}

/** getStations()などで使う、XMLパース後の地域データ */
export interface RegionData {
  region_name: string;
  region_id: string;
  ascii_name: string;
  stations: Array<{
    id: string;
    name: string;
    ascii_name: string;
    areafree: string;
    timefree: string;
    banner: string;
    area_id: string;
  }>;
}

/** stations Map に格納する局データ */
export interface StationInfo {
  RegionName: string;
  BannerURL: string;
  AreaID: string;
  AreaName: string;
  Name: string;
  AsciiName: string;
}
