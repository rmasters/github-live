var RATE = 1; // rate in seconds
var LIMIT = 20;

var events = [];

// Whether we already have this event
function eventInList(e) {
    for (var i in events) {
        if (events[i].id == e.id) {
            return true;
        }
    }
    return false;
}

// The types of events we want
function eventIsRequired(e) {
    return e.type == 'PushEvent';
}

// Convert a datetime string to relative seconds
function timeToRelative(timestr) {
    var diff = Math.round(Date.now()/1000 - new Date(timestr).getTime()/1000);
    return diff + ' seconds ago';
}

// Generate a random hexadecimal colour code
function randomColor() {
    var alpha = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += alpha[Math.round(Math.random() * 15)];
    }
    return color;
}

// Determine a contrasting color to the background
// http://www.codeproject.com/Articles/16565/Determining-Ideal-Text-Color-Based-on-Specified-Ba
function textColor(background) {
    var r = parseInt(background.substring(1, 3), 16);
    var g = parseInt(background.substring(3, 5), 16);
    var b = parseInt(background.substring(5, 7), 16);

    var threshold = 105;
    var bgDelta = (r*0.299)+(g*0.587)+(b*0.114);
    return ((255-bgDelta) < threshold) ? "#000000" : "#ffffff";
}

// Fetch new events from the api
function fetchNewEvents() {
    $.get('https://api.github.com/events', {}, function(evts) {
            $.each(evts.data, function(i, e) {
                // Check we don't already have this event and it is a type we're using
                if (!eventInList(e) && eventIsRequired(e)) {
                    // Generate a random colour
                    e.color = randomColor();
                    events.push(e);
                }
            });
            }, 'jsonp');
}

// Sort events in reverse chronological order
function sortEvents() {
    var reverse = true; // desc order
    events.sort(function(a, b) {
        var a_ts = new Date(a.created_at);
        var b_ts = new Date(b.created_at);
        // Prevent jumping if two or more events happened at the same time
        // Event IDs are probably chronological, but you never know :)
        if (a_ts == b_ts) {
            return a.id < b.id ? -1 : 1;
        }
        return (a_ts < b_ts) ? 1 : -1;
    });
}

// Limit our list of events to the N most recent, as defined by LIMIT
function removeOldEvents() {
    for (var i = events.length; i > LIMIT; i--) {
        events.pop();
    }
}

// Build the list of events
function redraw() {
    var container = $('#stream');
    container.empty();

    for (var i in events) {
        var e = events[i];
        var item = $('<article>');
        switch (e.type) {
            case 'PushEvent':
                item.html(Mustache.render(
                            '<b><a href="http://github.com/{{name}}">{{name}}</a></b> pushed to <a href="http://github.com/{{repo}}">{{repo}}</a> {{when}}', 
                            {name: e.actor.login, repo: e.repo.name, when: timeToRelative(e.created_at)}
                ));
                item.css('background', e.color);
                item.css('color', textColor(e.color));
                break;
        }
        container.append(item);
    }
}

function update() {
    fetchNewEvents();
    sortEvents();
    removeOldEvents();
    redraw();

    setTimeout(update, RATE*1000);
}

$(function() {
    update();
});
