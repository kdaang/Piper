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
        var lastTab = -1;
        var pipTab = -1;

        chrome.storage.local.get(['lastTab', 'pipTab'], data => {
            lastTab = data['lastTab'] || null;
            pipTab = data['pipTab'] || null;

            console.log(pipTab == null);

            console.log('lastTabId: ' + lastTab.tabId + ' lastTabWindowId: ' + lastTab.windowId);
            console.log('currentTabId: ' + activeInfo.tabId + ' currentTabWindowId: ' + activeInfo.windowId);
            if (pipTab != null) {
                console.log('pipTabId: ' + pipTab.tabId + ' pipTabWindowId: ' + pipTab.windowId);
            }

            var scriptTabId = -2;
            if ((pipTab == null) && lastTab.windowId === activeInfo.windowId) {
                scriptTabId = lastTab.tabId;
            } else if (pipTab != null && pipTab.tabId === activeInfo.tabId && pipTab.windowId === activeInfo.windowId) {
                scriptTabId = pipTab.tabId
            }

            if (scriptTabId !== -2) {
                console.log('EXECUTED SCRIPT on tab: ' + scriptTabId);
                chrome.tabs.executeScript(scriptTabId, {file: 'script.js', allFrames: true});
            }

            chrome.storage.local.set({'lastTab': {'tabId': activeInfo.tabId, 'windowId': activeInfo.windowId}});
        });
    });

    chrome.tabs.onUpdated.addListener( (tabId, changeInfo, tab) => {
        console.log('~~tabs.onUpdated~~');
        console.log('tabID: ' + tabId);
        console.log('tab.id: ' + tab.id);
        console.log('~~~~~~~~~~~~~~~~~~~');
        chrome.storage.local.set({'lastTab': {'tabId': tab.id, 'windowId': tab.windowId}});
    });
}

chrome.browserAction.onClicked.addListener(tab => {
    chrome.storage.local.clear()
});

chrome.runtime.onMessage.addListener( (request, sender, sendResponse) => {
    if (request.message === 'enter') {
        console.log('ENTER SENDER TAB: ' + sender.tab.id);
        chrome.storage.local.set({'pipTab': {'tabId': sender.tab.id, 'windowId': sender.tab.windowId}});
    } else if (request.message === 'leave') {
        console.log('LEAVE SENDER TAB: ' + sender.tab.id);
        chrome.storage.local.set({'pipTab': null});
    }
});