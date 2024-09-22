cat >dist/package.json <<!EOF
{
  "type": "commonjs"
}
!EOF

cp ./src/UIConfig.json ./dist/

mkdir -p ./dist/i18n
cp -a ./src/i18n/* ./dist/i18n/

mkdir -p ./dist/config
cp -a ./src/config/* ./dist/config/