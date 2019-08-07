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
var requests_served = 0;

const buttonHtml = `
<script>document.getElementById('clicky').onclick = function(){
        var queryvalue = document.getElementById('fieldy').value;
        window.location= window.location.href.split('?')[0] + '?action=search&name=' + queryvalue;
    }
    document.getElementById('fieldy').addEventListener("keyup", function (event) {
                // Number 13 is the "Enter" key on the keyboard 
                if (event.keyCode === 13) {
                    // Cancel the default action, if needed
                    event.preventDefault();
                    // Trigger the button element with a click
                    document.getElementById("clicky").click();
                }
            });
    document.getElementById('fieldy').value = '';
</script>
`;
const searchBarHtml = `
<p style="display:inline" ></p><input type="text" name="fname" id ="fieldy" autofocus>
    <button id="clicky">Search</button>

`;

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
        "Content-Type": "text/html; charset=utf-8" 
    });
    if ('action' in params) {
        //Returns the lyrics for the top result of the search query
        if (params.action == "search") {
            console.log('');
            searchquery: try{
                var songtitle = '';
                var songarray = [];
                if (params.name == ''){
                    res.write('<h3 style="font-family:Verdana;">Please Enter a Search Term...</h3><hr>');
                    res.write(searchBarHtml);
                    res.write(buttonHtml);
                    res.end();
                    console.log('No search term Received');
                    break searchquery;

                }
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
                        songarray = urlscrape.substring(19).split('-');
                        for (let i = 0; i<songarray.length-1; i++){
                            songtitle += songarray[i].charAt(0).toUpperCase() + songarray[i].slice(1) + " ";
                        }
                        res.write('<body><h3 style="font-family:Verdana;display:inline" >' + songtitle + '</h3>');
                        res.write(searchBarHtml);
                        res.write('&nbsp; &nbsp; &nbsp; &nbsp;' + buttonHtml);
                        res.write('<hr>')
                        res.write('<p style="font-family:Verdana;">' + finalresult.replace(/[\n\r]/g, '<br>').replace(/\[/g, '<b>[').replace(/\]/g, ']</b>'));
                        requests_served++;
                        res.write("<hr> Served total of: " + requests_served.toString() + " requests since last restart </p>");
                        res.end('</body>');
                        console.log('Request Served: ' + requests_served);
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
        else if (params.action == "wake")
        {
            console.log("Server Awoken");
            res.end();
        }
        //Todo: Search for Album, and grabs all songs on it.
    }
};
var server = http.createServer(instructionsNewVisitor);

server.listen(process.env.PORT || port);
console.log("Listening on Port " + (process.env.PORT || port));
