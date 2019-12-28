// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");1
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

if (!document.pictureInPictureEnabled) {
    chrome.browserAction.setTitle({title: 'Picture-in-Picture NOT supported'});
} else {
    chrome.tabs.onActivated.addListener(activeInfo => {
        var currentTab = -1;
        var pipTab = -1;

        chrome.storage.local.get(['currentTab', 'pipTab'], data => {
            currentTab = data['currentTab'] || -1;
            pipTab = data['pipTab'] || -1;

            console.log(data);

            console.log('tabID: ' + activeInfo.tabId);
            console.log('currentTab: ' + currentTab);
            console.log('pipID: ' + pipTab);
            // console.log('windowID: ' + activeInfo.windowId);
            var scriptTab = -2;
            if ((pipTab === -1)) {
                scriptTab = currentTab;
            } else if (pipTab === activeInfo.tabId) {
                scriptTab = pipTab
            }

            if (scriptTab !== -2) {
                console.log('EXECUTED SCRIPT on tab: ' + scriptTab);
                chrome.tabs.executeScript(scriptTab, {file: 'script.js', allFrames: true});
            }

            console.log('set CurrentTab: ' + activeInfo.tabId);
            chrome.storage.local.set({'currentTab': activeInfo.tabId});
        });
    });

    chrome.tabs.onUpdated.addListener( (tabId, changeInfo, tab) => {
        console.log('~~tabs.onUpdated~~');
        console.log('tabID: ' + tabId);
        console.log('tab.id: ' + tab.id);
        console.log('~~~~~~~~~~~~~~~~~~~');
        chrome.storage.local.set({'currentTab': tabId});
    });

    // chrome.webNavigation.onCreatedNavigationTarget.addListener(details => {
    //     console.log('~~webNavigation.onCreatedNavigationTarget~~');
    //     console.log('sourceTabId: ' + details.sourceTabId);
    //     console.log('~~~~~~~~~~~~~~~~~~~');
    // })
}

chrome.browserAction.onClicked.addListener(tab => {
    chrome.storage.local.clear()
});

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-134864766-1']);

chrome.runtime.onMessage.addListener( (request, sender, sendResponse) => {
    if (request.message === 'enter') {
        _gaq.push(['_trackPageview']);
        console.log('ENTER SENDER TAB: ' + sender.tab.id);
        chrome.storage.local.set({'pipTab': sender.tab.id});
    } else if (request.message === 'leave') {
        console.log('LEAVE SENDER TAB: ' + sender.tab.id);
        chrome.storage.local.set({'pipTab': -1});
    }
});

chrome.storage.sync.get({optOutAnalytics: false}, results => {
    if (results.optOutAnalytics) {
        return;
    }
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);
});
