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

export interface BrowseItem extends RadioStationItem {
  uri: string;
}

export interface BrowseList {
  title: string;
  availableListViews: string[];
  items: BrowseItem[];
}

export interface BrowseNavigation {
  lists: BrowseList[];
  prev?: { uri: string };
}

export interface BrowseResult {
  navigation: BrowseNavigation;
  uri: string;
}
