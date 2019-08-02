/*jshint esversion: 8 */
var http = require('http');
var url = require("url");
var fs = require('fs');
var querystring = require('querystring');
const api = require('genius-api');
var cheerio = require('cheerio');
var axios = require('axios');
var genius;
var accessToken;
//Place your token in accesstoken.txt
fs.readFile('accesstoken.txt',function(err,buff){
    if (err){console.log(err);}
    accessToken = buff;
    genius = new api(accessToken);
});

async function getData(artist_name) {
    try {
        return await genius.search(artist_name);
        
    } catch (error) {
        return await error;
    } finally {
        console.log('done');
    }
}

function parseSongHTML(htmltext)
{
    var lyrics;
    var body;

    body = cheerio.load(htmltext);
    lyrics = body('.lyrics').text();
    releaseDate = body('release-date.song_info-info').text();
   
        return lyrics;

    
} 

async function scrapeLyrics(url) {
    console.log('Waiting for Genius Site...');
    var result = await axios.get(url);
    return parseSongHTML(result.data);

}

var instructionsNewVisitor = function (req, res) {
        var params = querystring.parse(url.parse(req.url).query); //parses params
        var urlscrape = '';
        console.log(params);
        res.writeHead(200, {
            "Content-Type": "text/plain"
        });

        if ('action' in params) {
            if (params.action == "search") {
                console.log("Waiting for Genius API...");
                getData(params.name).then(data => {
                    console.log("writing");
                    urlscrape = data.hits[0].result.url;
                    console.log(urlscrape);
                    return scrapeLyrics(urlscrape);
                })
                .then(finalresult => {
                    res.write(urlscrape+'\n \n');
                    res.write(finalresult.substring(37));
                    res.end();
                })
                .catch(e => {
                    console.log(e);
                });
            }
        }
};

var server = http.createServer(instructionsNewVisitor);
server.listen(8081);
console.log("Listening");
