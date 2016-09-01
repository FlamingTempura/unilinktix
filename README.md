# Unilink Tix
An app to download ticket information from unilink account (e.g. how many passes remaining on a multi-day).

<img src="https://raw.githubusercontent.com/FlamingTempura/unilinktix/master/res/screenshot-tickets.png" width="250">

## running in browser

First install dependencies by running:
```sh
./fetch_dependencies
```

The `www` directory can be hosted and accessed in a web browser. The browser's content security settings will need to be disabled (since AJAX requests are made to Unilink). Chrome can be loaded with web security disabled:
```sh
google-chrome --disable-web-security --user-data-dir=/tmp/stuff
```

## building for android

Requires cordova (`npm install cordova --global`).

```sh
./fetch_dependencies
cordova build android
```

To run on plugged in android device:
```sh
cordova run android
```
