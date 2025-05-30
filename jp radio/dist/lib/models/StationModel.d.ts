/** ラジオ局の基本情報 */
export interface RadioStationItem {
    service: string;
    type: string;
    title: string;
    albumart: string;
    uri: string;
    name: string;
    samplerate: string;
    bitdepth: number;
    channels: number;
}
/** Browse用の項目。RadioStationItemを継承しつつ、uriにタイムスタンプを付与したものを想定 */
export interface BrowseItem extends RadioStationItem {
    uri: string;
}
/** ブラウズリスト */
export interface BrowseList {
    title: string;
    availableListViews: string[];
    items: BrowseItem[];
}
/** ナビゲーション情報 */
export interface BrowseNavigation {
    lists: BrowseList[];
    prev?: {
        uri: string;
    };
}
/** ブラウズ結果の最上位 */
export interface BrowseResult {
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
//# sourceMappingURL=StationModel.d.ts.map