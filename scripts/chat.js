chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (
        request.action === 'dump-prompt' &&
        (request.context || request.prompt)
    ) {
        await new Promise((resolve) => setTimeout(() => resolve(), 370));
        const input = document.getElementById('prompt-textarea');
        if (input?.blur) input.blur();
        input.value =
            (request.context ? request.context + '\n\n' : '') +
            (request.prompt || '');
        if (input?.focus) input.focus();
        input.style.height = '100px';
        if (input?.dispatchEvent)
            input.dispatchEvent(new Event('keydown', { key: 'Enter' }));
    }
});
