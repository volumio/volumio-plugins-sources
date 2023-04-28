import { writeFileSync } from 'fs';
import { EOL } from 'os';
import path from 'path';
import { DEFAULT_I18N_OPTIONS, I18nOptions, I18nOptionValue } from './i18n/common';
import { getI18nOptions as ytGetI18nOptions } from './i18n/yt';
import { getI18nOptions as ytmusicGetI18nOptions } from './i18n/ytmusic';

async function start() {
  const scriptName = 'gen-i18n-conf';

  const dryRunIndex = process.argv.indexOf('--dry-run');
  const forceIndex = process.argv.indexOf('--force');

  const dryRun = dryRunIndex > 0;
  const force = forceIndex > 0;

  const oIndex = process.argv.indexOf('-o');
  const oPath = process.argv[oIndex + 1];
  if (!oPath || oIndex === dryRunIndex || oIndex === forceIndex) {
    console.log(`[${scriptName}] No output path specified: use -o <path>`);
    process.exit(1);
  }

  let ytI18nOptions: I18nOptions;
  let ytmusicI18nOptions: I18nOptions;
  let result: I18nOptions;
  try {
    [ ytI18nOptions, ytmusicI18nOptions ] = await Promise.all([ ytGetI18nOptions(), ytmusicGetI18nOptions() ]);

    // Get intersection between yt and ytmusic options
    result = {
      region: [],
      language: []
    };

    if (!ytI18nOptions.region?.length) {
      console.log(`[${scriptName}] Warning: No regions returned by YouTube`);
    }
    if (!ytI18nOptions.language?.length) {
      console.log(`[${scriptName}] Warning: No languages returned by YouTube`);
    }
    if (!ytmusicI18nOptions.region?.length) {
      console.log(`[${scriptName}] Warning: No regions returned by YouTube Music`);
    }
    if (!ytmusicI18nOptions.language?.length) {
      console.log(`[${scriptName}] Warning: No languages returned by YouTube Music`);
    }

    for (const key of [ 'region', 'language' ] as Array<keyof I18nOptions>) {
      if (ytI18nOptions[key]?.length && ytmusicI18nOptions[key]?.length) {
        for (const o of ytI18nOptions[key] as I18nOptionValue[]) {
          if (ytmusicI18nOptions[key]?.find((o2) => o.value === o2.value)) {
            result[key]?.push(o);
          }
        }
      }
    }
  }
  catch (error: any) {
    if (error instanceof Error) {
      console.log(error.message);
      if (error.stack) {
        console.log(error.stack);
      }
    }
    else {
      console.log(error);
    }
    if (!force) {
      console.log(`[${scriptName}] Exit with error`);
      process.exit(1);
    }
    else {
      console.log(`[${scriptName}] (--force): continuing despite error...`);
    }
    result = {};
  }

  ([ 'region', 'language' ] as Array<keyof I18nOptions>).forEach((key) => {
    if (!result[key]?.length) {
      console.log(`[${scriptName}] No ${key}s obtained`);
      if (!force) {
        console.log(`[${scriptName}] Abort`);
        process.exit(1);
      }
      else {
        console.log(`[${scriptName}] (--force): use default ${key} values`);
        result[key] = DEFAULT_I18N_OPTIONS[key];
      }
    }
  });

  const file = path.resolve(oPath);

  if (dryRun) {
    console.log(`[${scriptName}] ${file} (--dry-run):${EOL}`);
    console.log(JSON.stringify(result));
    process.exit(0);
  }

  console.log(`[${scriptName}] Writing result to ${file}`);
  writeFileSync(file, JSON.stringify(result));
  console.log(`[${scriptName}] Done`);
}

start();
