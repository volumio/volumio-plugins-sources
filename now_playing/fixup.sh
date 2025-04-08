cat >dist/package.json <<!EOF
{
  "type": "commonjs"
}
!EOF

cp ./src/UIConfig.json ./dist/

mkdir -p ./dist/i18n
cp -a ./src/i18n/* ./dist/i18n/

mkdir -p ./dist/app/assets
cp -a ./src/app/assets/* ./dist/app/assets

mkdir -p ./dist/app/client
cp -a ./src/app/client/* ./dist/app/client

mkdir -p ./dist/app/preview
cp -a ./src/app/preview/* ./dist/app/preview

mkdir -p ./dist/app/views
cp -a ./src/app/views/* ./dist/app/views
