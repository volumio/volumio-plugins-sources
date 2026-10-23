# Volumio Open FM plugin

Wtyczka **Open FM** dla Volumio 4 (Bookworm). Port dodatku Kodi
[plugin.audio.open_FM](https://github.com/pajretX/plugin.audio.open_FM).

Pozwala przeglądać kategorie i stacje radia internetowego [open.fm](https://open.fm/)
oraz je odtwarzać.

## Funkcje
- Kategorie stacji (pobierane z `__NEXT_DATA__` strony open.fm).
- Lista „Wszystkie stacje" (wszystkie ~200 stacji, sortowane alfabetycznie).
- Strumienie podpisywane tokenem (`open.fm/api/user/token?fp=…`) — rozwiązywane
  leniwie w `explodeUri()`, tuż przed odtwarzaniem (HLS `.m3u8`).
- Cache listy stacji i kategorii (domyślnie 60 min, konfigurowalne).

## Instalacja

### Metoda właściwa — `volumio plugin install` (Volumio 4)
Ręczne kopiowanie do `/data/plugins/...` **nie rejestruje** wtyczki w Volumio 4.
Użyj menedżera pluginów:

1. Wgraj folder `openfm` na urządzenie (np. do `~/openfm`):
   ```
   scp -r openfm volumio@<ip>:~/
   ```
2. Zainstaluj:
   ```
   ssh volumio@<ip>
   cd ~/openfm
   rm -rf node_modules package-lock.json
   volumio plugin install
   ```
   Zaakceptuj ostrzeżenie o niezweryfikowanym pluginie („Yes").
3. Restart (jeśli potrzeba):
   ```
   sudo systemctl restart volumio
   ```
4. W UI: Settings → Plugins → **Enable** „Open FM".

### Przez git
```
ssh volumio@<ip>
git clone https://github.com/pajretX/volumio-openfm.git ~/volumio-openfm
cd ~/volumio-openfm
volumio plugin install
```

## Struktura
```
openfm/
├── index.js          # logika wtyczki
├── package.json      # metadane (volumio_info: music_service)
├── config.json       # cache_ttl_minutes
├── UIConfig.json     # strona ustawień
├── i18n/             # tłumaczenia (en, pl)
└── icon.png          # ikona źródła
```

## Uwagi
- Nazwy kategorii mają obcięte emoji (jak w dodatku Kodi) — Volumio renderuje
  emoji poprawnie, więc jeśli wolisz je zachować, usuń regex `EMOJI_RE` w `index.js`.
- Token strumienia jest krótkotrwały — dlatego URL jest podpisywany na nowo przy
  każdym `explodeUri()`, a nie zapisywany w drzewie.
