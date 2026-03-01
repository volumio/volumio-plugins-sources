# Radio Browser Plugin – Veröffentlichung im Volumio Plugin Store

Schritt-für-Schritt-Anleitung zur Submission und Veröffentlichung.

---

## Voraussetzungen

- [ ] **MyVolumio-Account** – derselbe wie bei der ursprünglichen Plugin-Submission
- [ ] **In MyVolumio eingeloggt** auf dem Volumio-Gerät
- [ ] **Fork von volumio-plugins-sources** – https://github.com/elpatron68/volumio-plugins-sources.git
- [ ] **SSH-Zugang** zum Volumio-Gerät

---

## Schritt 1: Code vorbereiten und committen

```bash
cd ~/volumio-plugins/volumio-plugins-sources

git status
git add radio_browser/
git commit -m "Radio Browser v1.0.3: Browse-Fix, Bitrate/Codec-Anzeige"
git push origin master
```

**Wichtig:** `volumio plugin submit` prüft, ob der Code gepusht ist.

---

## Schritt 2: Submission-Checklist prüfen

[Volumio Submission Checklist](https://developers.volumio.com/plugins/submission-checklist):

- [ ] Keine `console.log`-Ausgaben
- [ ] Plugin-Lifecycle: Effekte nur in `onStart`/`onStop`
- [ ] Keine System-Dateien überschreiben
- [ ] package.json vollständig

---

## Schritt 3: Plugin auf Volumio-Gerät vorbereiten

```bash
cd ~/volumio-plugins/volumio-plugins-sources/radio_browser

# Optional: VOLUMIO_IP=192.168.177.74 ./prepare-submit.sh
./prepare-submit.sh
```

---

## Schritt 4: volumio plugin submit (auf Volumio)

```bash
ssh volumio@192.168.177.79
cd /home/volumio/volumio-plugins-sources/radio_browser
volumio plugin submit
```

---

## Schritt 5: Nach der Submission

- **Erstes Mal:** Prüfung durch Volumio-Team, E-Mail-Benachrichtigung
- **Updates:** Beta-Kanal. Testmodus: `http://{volumio-ip}/dev` → „Plugins test mode“
- **Stable:** Nach Beta-Test durch Volumio-Team

---

## Häufige Probleme

| Problem | Lösung |
|--------|--------|
| „Code nicht gepusht“ | `git push origin master` im volumio-plugins-sources-Repo |
| „Nicht derselbe Owner“ | Mit dem ursprünglichen MyVolumio-Account einloggen |
| Unstaged changes | Auf Volumio: `git add radio_browser/` und `git commit` |

---

## Referenzen

- [Plugin Publishing](https://developers.volumio.com/plugins/plugin-publishing)
- [Submission Checklist](https://developers.volumio.com/plugins/submission-checklist)
- [Community: Plugin Store Issues](https://community.volumio.org/t/volumio3-plugins-store-issues-and-discussion/50608)
