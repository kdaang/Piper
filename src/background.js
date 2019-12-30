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
        var lastTabs = null;
        var pipTab = null;

        chrome.storage.local.get(['lastTab', 'pipTab'], data => {
            let windowIdKey = activeInfo.windowId.toString();
            lastTabs = data['lastTab'] || null;
            pipTab = data['pipTab'] || null;

            console.log(pipTab == null);

            if (lastTabs != null) {
                for (var key in lastTabs) {
                    console.log('lastTabId: ' + lastTabs[key] + ' lastTabWindowId: ' + key);
                }
            }
            if (activeInfo != null) {
                console.log('currentTabId: ' + activeInfo.tabId + ' currentTabWindowId: ' + activeInfo.windowId);
            }
            if (pipTab != null) {
                console.log('pipTabId: ' + pipTab.tabId + ' pipTabWindowId: ' + pipTab.windowId);
            }

            var lastTab = null;
            if (lastTabs != null && windowIdKey in lastTabs) {
                lastTab = {'tabId': lastTabs[windowIdKey], 'windowId': activeInfo.windowId};
            }

            if (lastTab != null && lastTab.tabId === activeInfo.tabId && lastTab.windowId === activeInfo.windowId) {
                return;
            }

            var scriptTabId = -2;
            if ((pipTab == null) && lastTab != null && lastTab.windowId === activeInfo.windowId) {
                scriptTabId = lastTab.tabId;
            } else if (pipTab != null && pipTab.tabId === activeInfo.tabId && pipTab.windowId === activeInfo.windowId) {
                scriptTabId = pipTab.tabId
            }

            if (scriptTabId !== -2) {
                chrome.tabs.query({'pinned': false, 'windowId': activeInfo.windowId}, tabs => {
                    for (var tab of tabs) {
                        if (tab.id === scriptTabId) {
                            console.log('EXECUTED SCRIPT on tab: ' + scriptTabId);
                            chrome.tabs.executeScript(scriptTabId, {file: 'script.js', allFrames: true});
                            break;
                        }
                    }
                });
            }

            chrome.storage.local.get(['lastTab'], data => {
                let windowIdKey = activeInfo.windowId.toString();
                var newLastTabs = data['lastTab'] || {};

                if (windowIdKey in newLastTabs) {
                    data['lastTab'][windowIdKey] = activeInfo.tabId;
                    chrome.storage.local.set(data);
                } else {
                    if (Object.keys(newLastTabs).length === 0) {
                        var newEntry = {};
                        newEntry[windowIdKey] = activeInfo.tabId;
                        chrome.storage.local.set({'lastTab': newEntry});
                    } else {
                        data['lastTab'][windowIdKey] = activeInfo.tabId;
                        chrome.storage.local.set(data);
                    }
                }
            });
        });
    });
}

chrome.tabs.onRemoved.addListener( (tabId, removeInfo) => {
    chrome.storage.local.get(['pipTab'], data => {
        var pipTab = data['pipTab'];

        if (pipTab != null && pipTab.tabId === tabId && pipTab.windowId === removeInfo.windowId){
            chrome.storage.local.set({'pipTab': null});
        }
    });
});

chrome.windows.onRemoved.addListener(windowId => {
    console.log('window removed: ' + windowId);
    chrome.storage.local.get(['lastTab'], data => {
        var lastTabs = data['lastTab'] || {};
        let windowIdKey = windowId.toString();


        if (windowIdKey in lastTabs) {
            delete lastTabs[windowIdKey];
            console.log(data);
            chrome.storage.local.set(data);
        }
    });
});

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