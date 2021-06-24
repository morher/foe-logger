var enableReporting, token, incmsg, exmsg, reportUrl;


function loadSettings() {
    chrome.storage.sync.get(['enableReporting', 'token', 'incmsg', 'exmsg', 'reportUrl'], updateSettings);
}

function createFilter(filterStr) {
    if (!filterStr) {
        return [];
    }
    return filterStr
        .split(',')
        .map(function (str) { return { 'service': str.replaceAll('*', ''), 'wildcard': str.endsWith('*') }; });
}

function updateSettings(settings) {
    enableReporting = settings.enableReporting ?? true;
    token = settings.token;
    incmsg = createFilter(settings.incmsg ?? "");
    exmsg = createFilter(settings.exmsg ?? "");
    reportUrl = settings.reportUrl;
}

function filterMatches(serviceName, filters) {
    var i;
    for (i = 0; i < filters.length; i++) {
        if (filters[i].wildcard
            ? serviceName.startsWith(filters[i].service)
            : serviceName == filters[i].service) {

            return true;
        }
    }
    return false;
}

function filterMessages(report) {
    var i, filteredResponses = [];
    for (i = 0; i < report.response.length; i++) {
        var response = report.response[i];
        var serviceName = response.requestClass + "." + response.requestMethod;
        if (filterMatches(serviceName, incmsg) && !filterMatches(serviceName, exmsg)) {
            filteredResponses.push(response);
        }
    }
    report.response = filteredResponses;
}

function filterAndSendReport(playerId, worldId, report) {
    if (enableReporting && reportUrl && token && playerId) {
        filterMessages(report);
        if (report.response) {
            fetch(reportUrl + "?player=" + playerId + "&world=" + worldId + "&token=" + token, {
                method: "POST",
                mode: 'cors',
                body: JSON.stringify(report),
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
}

function handleExternalMessage(request, sender, sendResponse) {
    if (request && request.action) {
        if (request.action == 'getSettings') {
            chrome.storage.sync.get(['token', 'incmsg', 'exmsg'], function (data) {
                sendResponse(data);
            });
        } else if (request.action == 'sendReport') {
            filterAndSendReport(request.playerId, request.world, request.report);

        }
    }
}

loadSettings();
chrome.storage.onChanged.addListener(loadSettings);
chrome.runtime.onMessageExternal.addListener(handleExternalMessage);
