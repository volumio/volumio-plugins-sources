export interface RadikoXMLData {
  radiko: {
    stations: {
      station: RadikoXMLStation[];
    };
  };
}

export interface RadikoXMLStation {
  '@id': string;
  progs: {
    prog: {
      '@id': string;
      '@ft': string;
      '@to': string;
      title: string;
      pfm?: string;
    }[];
  };
}
