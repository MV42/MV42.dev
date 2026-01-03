# Web Portfolio

Static portfolio files served by the main server.

## Structure

```
public/
├── index.html        # Portfolio landing page
├── portfolio.css
├── auto-fit-text.css
├── auto-fit-text.js
├── 404.html
│
├── CV/               # Interactive CV
│   └── index.html
│
├── FOV/              # Field of View calculator
│   └── index.html
│
└── OptiTime/         # Time optimization tool
    ├── index.html
    ├── script.js
    └── style.css
```

## Serving

Static files are served by the main Express server at `/index.js`:

```javascript
app.use(express.static(path.join(__dirname, 'web/public')));
```

## Access

- **Portfolio**: `https://mv42.dev/`
- **CV**: `https://mv42.dev/CV/`
- **FOV Calculator**: `https://mv42.dev/FOV/`
- **OptiTime**: `https://mv42.dev/OptiTime/`

## Features

- Zero build process
- Pure HTML/CSS/JS
- No dependencies
- Fast and lightweight
- Custom 404 page

All routing handled by Nginx → Express static middleware.