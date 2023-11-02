import { WeatherData } from 'now-playing-common';
export interface WeatherAPIConfig {
    coordinates: string;
    units: 'imperial' | 'metric' | 'standard';
}
export interface WeatherAPIParsedConfig {
    coordinates?: {
        lon: number;
        lat: number;
    };
    units: 'imperial' | 'metric' | 'standard';
}
declare class WeatherAPI {
    #private;
    constructor();
    clearCache(): void;
    setConfig(opts: WeatherAPIConfig): void;
    fetchInfo(): Promise<WeatherData>;
}
declare const weatherAPI: WeatherAPI;
export default weatherAPI;
//# sourceMappingURL=WeatherAPI.d.ts.map