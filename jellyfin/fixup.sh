cat >dist/package.json <<!EOF
{
  "type": "commonjs"
}
!EOF

cp ./src/UIConfig.json ./dist/

mkdir -p ./dist/assets
cp -a ./src/assets/* ./dist/assets/

mkdir -p ./dist/i18n
cp -a ./src/i18n/* ./dist/i18n/
