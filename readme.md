# <img src="public/icons/icon_48.png" width="45" align="left"> Skip Youtube Sponsor Talk

Youtube Sponsorship Talks Skip

## Features

- Auto finds and skips sponsorship talks in youtube videos
- [Get **Groq** Api Key] (needs API Key to use)<!-- TODO: Add groq api key link inside parenthesis -->

## Install

### Step A To use directly

- Follow photo guide below to install unpacked extension at chrome (Select build folder inside skip_advert main folder)

- [**Chrome** extension](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)

- Follow photo guide below to Pin extension to see in bar
- [**PIN** the extension](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#pin_the_extension)

- Click the Enable Auto Skip button

### Step B to develop extension

- create .env file in main folder with your groq api api key

```NODE_ENV=development
  GROQ_API_KEY= xxxxxxxx API KEY HERE xxxxxxxxx

```

- open terminal
- `git clone https://github.com/atacolak/skip_advert.git`
- `cd skip_advert`

- `npm install`

- `npm run watch`
- make your changings
- `npm run build`
- Continue with step A

### Enjoy (You can check chrome console to follow extension)

## Contribution

Suggestions and pull requests are welcomed!.

---

This project was bootstrapped with [Chrome Extension CLI](https://github.com/dutiyesh/chrome-extension-cli)
