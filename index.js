const request = require('request');
const cheerio = require('cheerio');
const async = require('async');
const fs = require('fs');
const http = require('http');

var baseUrls = [
{
    name: 'bolero',
    url: 'http://hopamviet.com/chord/rhythm/1/bolero'
}, {
    name: 'slow',
    url: 'http://hopamviet.com/chord/rhythm/2/slow'
}, {
    name: 'slow-rock',
    url: 'http://hopamviet.com/chord/rhythm/3/slow-rock'
}, {
    name: 'slow-surf',
    url: 'http://hopamviet.com/chord/rhythm/4/slow-surf'
}, {
    name: 'blues',
    url: 'http://hopamviet.com/chord/rhythm/5/blues'
}, {
    name: 'ballade',
    url: 'http://hopamviet.com/chord/rhythm/6/ballade'
}, {
    name: 'chachacha',
    url: 'http://hopamviet.com/chord/rhythm/7/chachacha'
}, {
    name: 'disco',
    url: 'http://hopamviet.com/chord/rhythm/8/disco'
}, {
    name: 'rhumba',
    url: 'http://hopamviet.com/chord/rhythm/9/rhumba'
}, {
    name: 'tango',
    url: 'http://hopamviet.com/chord/rhythm/10/tango'
}, {
    name: 'boston',
    url: 'http://hopamviet.com/chord/rhythm/11/boston'
}, {
    name: 'fox',
    url: 'http://hopamviet.com/chord/rhythm/12/fox'
}, {
    name: 'rock',
    url: 'http://hopamviet.com/chord/rhythm/13/rock'
}, {
    name: 'valse',
    url: 'http://hopamviet.com/chord/rhythm/14/valse'
}, {
    name: 'bossa-nova',
    url: 'http://hopamviet.com/chord/rhythm/15/bossa-nova'
}, {
    name: 'pop',
    url: 'http://hopamviet.com/chord/rhythm/16/pop'
}, {
    name: 'habanera',
    url: 'http://hopamviet.com/chord/rhythm/17/habanera'
}, {
    name: 'twist',
    url: 'http://hopamviet.com/chord/rhythm/18/twist'
}, {
    name: 'march',
    url: 'http://hopamviet.com/chord/rhythm/19/march'
}, {
    name: 'pasodope',
    url: 'http://hopamviet.com/chord/rhythm/20/pasodope'
}, {
    name: 'slow-ballad',
    url: 'http://hopamviet.com/chord/rhythm/21/slow-ballad'
}, {
    name: 'rap',
    url: 'http://hopamviet.com/chord/rhythm/22/rap'
}]

var totalCount = 0;


function main() {
    //load through pages
    async.eachSeries(baseUrls, function (item, callback) {
        var baseUrl = item.url;
        var curPage = 0;
        var urls = [];
        var isEnd = false;

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

                    console.log('Successfully get all songs from page: ' + (curPage + 1) + ' of type: ' + item.name);
                    curPage++;
                    callback();
                });
            }, function () {
                return !isEnd;
            }, function (err) {
                if (err) {
                    return callback(err);
                };

                var data = {
                    urls: urls,
                    count: urls.length,
                    type: item.name
                }

                var dataStr = '';
                urls.forEach(function (item) {
                    if (!item.url) {
                        return;
                    };

                    dataStr += item.url + '\n';
                })

                totalCount += urls.length;

                fs.writeFileSync(item.name + '-pretty.json', JSON.stringify(data, null, 4));
                fs.writeFileSync(item.name + '.txt',dataStr);
                console.log('Successfully get ' + urls.length + ' songs of type: ' + item.name);
                return callback();
            });
    }, function (err) {
        if (err) {
            console.log(err.stack);
            console.trace();
        };

        console.log('Successfull get ' + totalCount + ' songs');
    })
}

main();
//downloadSongs();

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
    var curPageUrl = baseUrl + '/' + curPage * 10;
    debugger;

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