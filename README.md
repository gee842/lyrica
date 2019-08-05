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
