const settings = document.forms.settings;

function fillSettings(data) {
    settings.enableReporting.checked = data.enableReporting ?? true;
    settings.token.value = data.token ?? '';
    settings.incmsg.value = data.incmsg ?? '';
    settings.exmsg.value = data.exmsg ?? '';
    settings.reportUrl.value = data.reportUrl ?? 'https://foe.honu.city/game-events/api-report';
}

document.forms.settings.onsubmit = function () {
    chrome.storage.sync.set({
        'enableReporting': settings.enableReporting.checked,
        'token': settings.token.value,
        'incmsg': settings.incmsg.value,
        'exmsg': settings.exmsg.value,
        'reportUrl': settings.reportUrl.value
    })
    return false;
}

chrome.storage.sync.get(['enableReporting', 'token', 'incmsg', 'exmsg', 'reportUrl'], fillSettings);
