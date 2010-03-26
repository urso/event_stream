
var startFetch = function (x) {
    $('status').set('text', 'start fetching');
    $('output').set('text', '');
    return x;
}.stream().curry(false);

var stopFetch = function (x) {
    $('status').set('text', 'fetched');
}.stream().curry(false);

var fetchData = new Request({url: 'index.html'}).stream().curry(false);
//var fetchData = $ESRequest({url: 'index.html'}).curry(false);

function init () {
    var btn = startFetch($('btn'));
    $('count').stream($ESpos(btn));

    var f = fetchData(btn);
    stopFetch(f);
    $('output').stream(false, f);
}

window.addEvent('domready', function() {
    init();
});

