# Cricket Academy

Static website for Vertex Cricket Academy. The website project lives in this
folder, alongside its Git repository.

## File structure

```text
cricket Academy/
├── index.html              # Entry point; opens pages/Homepage1.html
├── pages/                  # Public website pages and account sign-in
├── student-dashboard/      # Student account and dashboard pages
├── tools/                  # Browser regression checks
├── assets/
│   ├── css/                # Main styles, dark mode, and RTL styles
│   ├── js/                 # Website and dashboard scripts
│   └── images/             # Images used by the website
├── .nojekyll               # Allows plain static hosting on GitHub Pages
└── README.md
```

Open `index.html` in a browser or serve this folder with a local static server.
Keep the relative paths between pages and assets when deploying the website.
Both home page variants are used by the navigation.

## Design and verification

`style.css` defines the page layouts, `dark-mode.css` defines neutral dark-theme
surfaces, and `coaching.css` contains shared typography, compact layouts and CTA
styles. All pages load these styles in the same order. The existing scripts handle
menus, themes, program recommendations, forms and student-dashboard controls.

This is a static site: there is no dependency manifest, production build or
TypeScript step. Form submissions retain their existing local demo behavior.

Browser checks use Playwright with an installed Microsoft Edge browser:

```text
node tools/check-site.cjs <path-to-playwright-package>
node tools/check-interactions.cjs <path-to-playwright-package>
```

The layout check covers every page at 375, 480, 768, 1024, 1280 and 1440 pixels in
both themes. Generated screenshots and reports are saved in the ignored `qa/`
folder. External fonts and maps are excluded from these local regression checks.
