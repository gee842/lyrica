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
const port = 8081;
//Place your token in accesstoken.txt
fs.readFile('accesstoken.txt',function(err,buff){
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

function parseSongHTML(htmltext)
{
    var lyrics;
    var body;
    body = cheerio.load(htmltext);
    lyrics = body('.lyrics').text();
    return lyrics;

    
} 

async function scrapeLyrics(url) {
    var result = await axios.get(url);
    return parseSongHTML(result.data);

}

var instructionsNewVisitor = function (req, res) {
    var params = querystring.parse(url.parse(req.url).query); //parses params
    var urlscrape = '';
    res.writeHead(200, {
        "Content-Type": "text/plain"
    });

    if ('action' in params) {
        if (params.action == "search") {
            console.log('');
            try{
                console.log("Request Received: " + params.name)
                console.log("Waiting for Genius API...");
                getData(params.name).then(data => {
                    urlscrape = data.hits[0].result.url;
                    console.log("URL Found:" + urlscrape);
                    console.log('Waiting for Genius Site...');
                    return scrapeLyrics(urlscrape);
                })
                    .then(finalresult => {
                        res.write(urlscrape + '\n \n');
                        res.write(finalresult.substring(37));
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
    }
};

var server = http.createServer(instructionsNewVisitor);
server.listen(port);
console.log("Listening on Port " + port);
