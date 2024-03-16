const os = require('os');
const uiconf = require('../src/UIConfig.json');

const sectionKeys = [];

const sectionContentKeys = {};

uiconf.sections.forEach((section) => {
  sectionKeys.push(section.id);
  sectionContentKeys[section.id] = section.content?.map((c) => c.id) || [];
});

const lines = ['// Auto-generated from ./src/UIConfig.json' + os.EOL];
lines.push('import { UIConfigButton, UIConfigInput, UIConfigSelect, UIConfigSwitch } from "./UIConfig";')

lines.push('export type UIConfigSectionKey = ');
const sectionKeyLines = sectionKeys.map((key) => `              '${key}'`);
lines.push(sectionKeyLines.join(` | ${os.EOL}`) + ';' + os.EOL);


lines.push('export type UIConfigSectionContentKeyOf<K extends UIConfigSectionKey> =');
for (const [sectionKey, contentKeys] of Object.entries(sectionContentKeys)) {
  if (contentKeys.length > 0) {
    const contentKeyLines = contentKeys.map((key) => `    '${key}'`);
    lines.push(`  K extends '${sectionKey}' ?` + os.EOL +
      `${contentKeyLines.join(` | ${os.EOL}`)} :` + os.EOL);
  }
}
lines.push('  never;' + os.EOL);

const elWarnings = [];
lines.push('export type UIConfigElementOf<K extends UIConfigSectionKey, C extends UIConfigSectionContentKeyOf<K>> =');
for (const section of uiconf.sections) {
  const content = section.content;
  if (content && content.length > 0) {
    const elLines = [];
    for (const el of content) {
      let elType;
      switch (el.element) {
        case 'input':
          elType = `UIConfigInput<K, '${el.type || 'text'}'>`;
          break;
        case 'select':
          elType = 'UIConfigSelect<K>';
          break;
        case 'switch':
          elType = 'UIConfigSwitch<K>';
          break;
        case 'button':
          elType = 'UIConfigButton<K>';
          break;
        default:
          elWarnings.push(`Warning: unknown element type ${el.element}`);
          elType = null;
      }
      if (elType) {
        elLines.push(`    C extends '${el.id}' ? ${elType}`);
      }
    }
    if (elLines.length > 0) {
      elLines.push('    never');
      lines.push(`  K extends '${section.id}' ? (`);
      lines.push(elLines.join(' :' + os.EOL));
      lines.push(`  ) : ` + os.EOL);
    }
  }
}
lines.push('  never;' + os.EOL);
elWarnings.forEach((w) => console.log(`// ${w}`));

const output = lines.join(os.EOL);

console.log(output);
