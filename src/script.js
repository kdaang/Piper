(async () => {
    const videos = Array.from(document.querySelectorAll('video'))
        .filter(video => video.readyState != 0)
        .filter(video => video.disablePictureInPicture == false)
        .filter(video => !video.paused || video.hasAttribute('__pip__'))
        .sort((v1, v2) => {
            const v1Rect = v1.getClientRects()[0];
            const v2Rect = v2.getClientRects()[0];
            return ((v2Rect.width * v2Rect.height) - (v1Rect.width * v1Rect.height));
        });

    if (videos.length === 0)
        return;

    const video = videos[0];

    console.log(window);
    console.log(window.navigator);

    if (video.hasAttribute('__pip__')) {
        await document.exitPictureInPicture().catch(error => {
            console.log('FAILED: ' + error)
        });
        chrome.runtime.sendMessage({message: 'leave'});
    } else {
        console.log('REQUESTED PIP')
        await video.requestPictureInPicture().catch(error => {
            console.log('FAILED: ' + error)
        });
        video.setAttribute('__pip__', true);
        video.addEventListener('leavepictureinpicture', event => {
            video.removeAttribute('__pip__');
            chrome.runtime.sendMessage({message: 'leave'});
        }, {once: true});

        chrome.runtime.sendMessage({message: 'enter'});
    }
})();
