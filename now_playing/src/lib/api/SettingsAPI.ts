import CommonSettingsLoader from '../config/CommonSettingsLoader';
import { CommonSettingsCategory } from 'now-playing-common';

class SettingsAPI {
  async getSettings({ category }: { category: string; }) {
    if (Object.values(CommonSettingsCategory).includes(category as any)) {
      return CommonSettingsLoader.get(category as CommonSettingsCategory);
    }
    throw Error(`Unknown settings category ${category}`);
  }
}

const settingsAPI = new SettingsAPI();

export default settingsAPI;
