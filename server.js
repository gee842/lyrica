/*jshint esversion: 8 */
//Place your token in accesstoken.txt
//Creates a cache to bypass the scraper if song has been previously searched
const ACCESS_TOKEN_FILE = 'accesstoken.txt';
const LYRIC_CACHE_FILE = './lyric_cache.db';
var http = require('http');
var url = require("url");
var fs = require('fs');
var querystring = require('querystring');
const api = require('genius-api');
var cheerio = require('cheerio');
var axios = require('axios');
var genius;
var accessToken;
const port = 8081;
var Datastore = require('nedb-promises');
var cachefile = Datastore.create(LYRIC_CACHE_FILE);

fs.readFile(ACCESS_TOKEN_FILE, function (err, buff) {
    if (err){console.log(err);}
    accessToken = buff;
    genius = new api(accessToken);
});

async function getData(artist_name) {
    try {
        return await genius.search(artist_name);
    } 
    catch (error) {
        return await error;
    }
}

function parseSongHTML(htmltext,urlscrape)
{
    var lyrics;
    var body;
    body = cheerio.load(htmltext);
    lyrics = body('.lyrics').text().substring(37);
    var dbpayload = {
        saved_url: urlscrape,
        lyric_body: lyrics,
    };
    cachefile.insert(dbpayload, function (err, newDoc) {});
    return lyrics;
} 

async function scrapeLyrics(url) {
    var result = await axios.get(url);
    return parseSongHTML(result.data,url);

}

var instructionsNewVisitor = function (req, res) {
    var params = querystring.parse(url.parse(req.url).query); //parses params
    var urlscrape = '';
    res.writeHead(200, {
        "Content-Type": "text/plain"
    });
    if ('action' in params) {
        //Returns the lyrics for the top result of the search query
        if (params.action == "search") {
            console.log('');
            try{
                console.log("Request Received: " + params.name);
                console.log("Waiting for Genius API...");
                getData(params.name)
                .then(data => {
                    urlscrape = data.hits[0].result.url;
                    console.log("URL Found: " + urlscrape);
                    return urlscrape;
                })
                .then(saurl => {
                    return cachefile.find({
                        saved_url: saurl
                    })
                ;})
                .then(docs =>{
                    if (docs.length > 0) {
                        console.log('Found in Cache!');
                        return docs[0].lyric_body;

                    } else {
                        console.log('Waiting for Genius Site...');
                        return scrapeLyrics(urlscrape);
                    }
                })
                .then(finalresult => {
                        res.write(urlscrape + '\n \n');
                        res.write(finalresult);
                        res.end();
                        console.log('Request Served!');
                        console.log('');
                })
                .catch(e => {
                    console.log(e);
                });
            }
            catch(err){
                console.log(err);
            }
            
        

        }
        //Todo: Search for Album, and grabs all songs on it.
    }
};
var server = http.createServer(instructionsNewVisitor);

server.listen(process.env.PORT || port)
console.log("Listening on Port " + (process.env.PORT || port));
