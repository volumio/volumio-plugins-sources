"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LyricsParser {
    async parseDto(data) {
        /**
         * LyricDto supposedly has `Metadata.IsSynced` property but
         * `Metadata` is empty (as of v10.9.6). We need to test by
         * looping through each line of lyrics.
         */
        if (!data.Lyrics) {
            return null;
        }
        const isSynced = data.Lyrics.every((line) => line.Start !== undefined);
        if (isSynced) {
            const lines = data.Lyrics.map((line) => ({
                text: line.Text || '',
                // Convert to milliseconds
                start: line.Start ? line.Start / 10000 : 0
            })) || [];
            if (lines.length > 0) {
                return {
                    type: 'synced',
                    lines
                };
            }
        }
        else {
            const lines = data.Lyrics?.reduce((result, line) => {
                if (line.Text !== undefined) {
                    result.push(line.Text);
                }
                return result;
            }, []) || [];
            if (lines.length > 0) {
                return {
                    type: 'plain',
                    lines
                };
            }
        }
        return null;
    }
}
exports.default = LyricsParser;
//# sourceMappingURL=LyricsParser.js.map