chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (
        request.action === 'dump-prompt' &&
        (request.context || request.prompt || request.selectedText)
    ) {
        await new Promise((resolve) => setTimeout(() => resolve(), 350));
        const input = document.getElementById('prompt-textarea');
        if (input) {
            input.blur();
            input.value =
                (request.selectedText
                    ? `"""\n${request.selectedText}\n"""${request.context || request.prompt ? '\n\n' : ''}`
                    : '') +
                (request.context || '') +
                (request.context && request.prompt ? '\n\n' : '') +
                (request.prompt || '');
            input.focus();
            const event = new Event('input', { bubbles: true });
            input.dispatchEvent(event);
        }
    }
});
