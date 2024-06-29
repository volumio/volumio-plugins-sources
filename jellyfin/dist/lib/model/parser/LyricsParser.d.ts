import { LyricDto } from '@jellyfin/sdk/lib/generated-client/models/lyric-dto';
import { MetadataLyrics } from 'now-playing-common';
export default class LyricsParser {
    parseDto(data: LyricDto): Promise<MetadataLyrics | null>;
}
//# sourceMappingURL=LyricsParser.d.ts.map