# lyrica
Node based api to grab lyrics from the Genius API

Uses NeDB as an on-disk cache to bypass scraping Genius, if the lyric had been scraped before.

Completely Asynchronous, handles multiple requests simultaneously.

## setup
Get a GeniusAPI access token

Add a 'accesstoken.txt' at the project root.

## usage
To Run:
```node server.js```

To use:

http://localhost:8081/?action=search&name=${YOUR_SEARCH_QUERY}


## Hosted At: https://gee842.github.io/landing/lyrica-home.html

The most lightweight lyric finder possible, just sends you pure text.

Stop eating away art your precious data plan, get only what you were looking for: just lyrics.

I will never run ads, this costs me nothing and therefore should make me nothing. (Also means I won't pay for marketing this, so share with your friends if you enjoy it)
