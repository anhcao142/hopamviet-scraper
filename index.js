const request = require('request');
const cheerio = require('cheerio');
const async = require('async');
const fs = require('fs');
const http = require('http');

const baseUrl = 'http://hopamviet.com/chord/rhythm/1/bolero/';

var urls = [];
var curPage = 0;
var isEnd = false;

function main() {
    //load through pages
    async.doWhilst(
        function (callback) {
            getDownloadUrls(baseUrl, curPage, urls, function (err, isPageEnd) {
                if (err) {
                    return callback(err);
                };

                if (isPageEnd) {
                    isEnd = isPageEnd;
                    return callback();
                };

                console.log('Successfully get songs from page ' + (curPage + 1));
                curPage++;
                callback();
            });
        }, function () {
            return !isEnd;
        }, function (err) {
            if (err) {
                console.trace();
            };

            fs.writeFileSync('out.json', JSON.stringify(urls, null, 4));
            console.log('Successfull');
        });
}

//main();
downloadSongs();

function downloadSongs() {
    var urls = fs.readFileSync('out.json');

    urls = JSON.parse(urls);

    var url = '';
    urls.forEach(function (item) {
        if (!item.url) {
            return;
        };

        url += item.url + '\n';
    });

    fs.writeFileSync('out2.txt', url);
}

function getDownloadUrls(baseUrl, curPage, urls, callback) {
    var curPageUrl = baseUrl + curPage * 10;

    request.get(curPageUrl, function (err, res, html) {
        if (err) {
            return callback(err);
        };

        var songUrls = [];
        var $ = cheerio.load(html);

        if (!$('.container .row .col-md-8 .ct-box:nth-child(2) .col-md-12').html()) {
            return callback(null, true);
        };

        $('.container .row .col-md-8 .ct-box:nth-child(2) .col-md-12').each(function (i, ele) {
            songUrls.push($(this).find('a').attr('href'));
        })

        actualGetDownloadUrls(songUrls, urls, function (err) {
            if (err) {
                return callback(err);
            };

            return callback();
        });
    })
}

function actualGetDownloadUrls(songUrls, urls, callback) {
    async.each(songUrls, function (songUrl, callback) {
        request.get(songUrl, function (err, res, html) {
            if (err) {
                return callback(err);
            };

            var $ = cheerio.load(html);
            var song = {
                name: $('.container .ct-box:nth-child(2) h3').children().remove().end().text().replace(/\t+|\r+|\n+/g, '').trim(),
            }

            if ($('.fa-download')) {
                song.url = $('#fullsong p:first-child .pull-right a').attr('href');
            } else {
                song.url = $('#fullsong p:nth-child(2) source').attr('src');
            }

            urls.push(song);
            callback();
        })
    }, function (err) {
        return callback(err);
    })
}