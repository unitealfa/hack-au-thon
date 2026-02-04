# Agricoole Widget + Gemini API

Ce dossier contient un widget autonome (vanilla JS) et un petit serveur Node pour appeler Gemini en securite.

## Structure

- widget/agricoole-widget.js
- widget/demo.html
- server/server.js
- server/package.json
- server/.env.example

## Serveur (Node)

1. Copier `server/.env.example` vers `server/.env` et renseigner `GEMINI_API_KEY`.
2. Installer les dependances :

```bash
cd server
npm install
```

3. Lancer le serveur :

```bash
npm start
```

Le serveur expose :
- POST `/api/agricoole/analyze`
- POST `/api/agricoole/chat`

## Widget

Heberger `widget/agricoole-widget.js` comme un fichier statique (CDN ou serveur du site).

### Exemple d integration

```html
<script>
  window.AGRICOOLE_WIDGET_CONFIG = {
    apiBaseUrl: "http://localhost:8787/api/agricoole",
    position: "right"
  };
</script>
<script src="/widget/agricoole-widget.js"></script>
```

### Options de config

- `apiBaseUrl` (string) : URL de base de l API.
- `title` (string) : titre du widget.
- `position` ("right" | "left") : position de la bulle.
- `autoAnalyze` (boolean) : analyser des que la photo est choisie.
- `primaryColor` / `accentColor` : couleurs principales.

## Notes

- Ne jamais exposer la cle Gemini dans le front.
- Si le modele ne repond pas, lister les modeles via l endpoint `https://generativelanguage.googleapis.com/v1beta/models`.

