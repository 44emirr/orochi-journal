# Orochi Journal

A free trading journal from [Orochi Trading](https://github.com/44emirr/orochi-journal). Use it to plan the day, log trades, journal, review, and look at your stats. It's built for futures day traders who use AMT, VWAP, market profile, and orderflow.

**Open it:** https://44emirr.github.io/orochi-journal/

## Put it on your phone

It installs from the browser. There's no app store and no account.

- **iPhone:** open the link in **Safari** → tap Share → **Add to Home Screen**.
- **Android:** open the link in **Chrome** → tap ⋮ → **Install app** (or **Add to Home screen**).
- **PC / Mac:** open the link in Chrome or Edge → click the install icon in the address bar.

It opens full screen with its own icon, and it still works with no internet.

## Where your trades live

Your trades are saved **only on the device you're using**, inside that browser. Nothing gets uploaded and nobody else can see them, us included.

This also means your phone and your PC each keep their own separate journal. To move trades from one to the other, go to **Settings → Export backup** on the first device, then **Import** on the second. Export a backup every so often anyway, because clearing your browser data deletes the journal.

## For developers

The whole thing is plain HTML, CSS, and JavaScript (React 18, no bundler). There are no dependencies to install.

```
src/        app source (CSS + JS, joined together in file-name order)
src-web/    phone-app files: install manifest, offline service worker, icons
vendor/     React (MIT) and the logo images
tools/      local test server and regression checks
docs/       the built website that GitHub Pages serves (made by build.sh, don't edit by hand)
```

Build it:

```bash
bash build.sh
```

This writes `OrochiJournal.html` (one file that runs straight from disk) and `docs/` (the website).

Test it locally: run `tools/serve.ps1` (Windows) or `python -m http.server` in this folder, then open `/docs/?ns=test`. The `?ns=` part gives you a separate test journal, so your real data never gets touched. To run the regression checks, open the browser console and load `tools/regress.js`, then run `await __regress()`.

## License

The code is MIT. The Orochi name and the logo artwork belong to Orochi Trading. If you fork this, use your own branding.
