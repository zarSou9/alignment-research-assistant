chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (
        request.action === 'dump-prompt' &&
        (request.context || request.prompt)
    ) {
        await new Promise((resolve) => setTimeout(() => resolve(), 370));
        const input = document.getElementById('prompt-textarea');
        if (input) {
            input.blur();
            input.value =
                (request.context ? request.context : '') +
                (request.context && request.prompt ? '\n\n' : '') +
                (request.prompt || '');
            input.focus();
            const event = new Event('input', { bubbles: true });
            input.dispatchEvent(event);
        }
    }
});
