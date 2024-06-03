chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === 'toggle-modal') {
        const extension = document.getElementById('extension-container');
        if (extension) {
            extension.remove();
        } else {
            fetch(chrome.runtime.getURL('components/modal/index.html'))
                .then((response) => response.text())
                .then((html) => {
                    const container = document.createElement('div');
                    container.id = 'extension-container';
                    container.innerHTML = html;
                    document.body.appendChild(container);

                    const promptNav =
                        document.getElementById('extension-left-nav');
                    const modal = document.getElementById('extension-modal');
                    const modalBackground = document.getElementById(
                        'extension-modal-background'
                    );
                    const contextCheck = document.getElementById(
                        'extension-context-check-button'
                    );
                    const contextEdit = document.getElementById(
                        'extension-context-edit-button'
                    );
                    const promptCheck = document.getElementById(
                        'extension-prompt-check-button'
                    );
                    const promptEdit = document.getElementById(
                        'extension-prompt-edit-button'
                    );
                    const contextBox =
                        document.getElementById('ext-context-box');
                    const promptBox = document.getElementById('ext-prompt-box');
                    const contextListItem = document.getElementById(
                        'extension-context-list-item'
                    );
                    const contextPlaceHolder = document.getElementById(
                        'extension-context-place-holder'
                    );

                    const contextList = [];

                    promptNav.style.fontWeight = '700';

                    contextCheck.remove();
                    contextListItem.remove();
                    contextPlaceHolder.remove();

                    modal.addEventListener('click', (e) => {
                        e.stopPropagation();
                    });
                    modalBackground.addEventListener('click', () => {
                        container.remove();
                    });

                    contextEdit.addEventListener('click', () => {
                        contextEdit.remove();
                        contextBox.appendChild(contextCheck);
                        contextList.forEach((li) => {
                            li.element.children[0].children[0].style.pointerEvents =
                                'none';
                            li.textarea.style.pointerEvents = 'all';
                        });
                        contextBox.appendChild(contextPlaceHolder);
                    });
                    contextCheck.addEventListener('click', () => {
                        contextCheck.remove();
                        contextPlaceHolder.remove();
                        contextBox.appendChild(contextEdit);
                        contextList.forEach((li) => {
                            li.element.children[0].children[0].style.pointerEvents =
                                'all';
                            li.textarea.style.pointerEvents = 'node';
                        });
                    });

                    function handleTextarea(li) {
                        li.textarea.style.height = 'auto';
                        li.textarea.style.height =
                            li.textarea.scrollHeight + 'px';
                        li.text = li.textarea.value;
                    }

                    contextPlaceHolder.addEventListener('click', () => {
                        const newItem = {
                            element: contextListItem.cloneNode(true),
                            id: Math.random().toString(),
                            text: '',
                        };
                        contextList.push(newItem);
                        contextBox.insertBefore(
                            newItem.element,
                            contextPlaceHolder
                        );
                        newItem.element.id = newItem.id;
                        newItem.textarea = newItem.element.children[1];
                        newItem.textarea.addEventListener('input', () => {
                            handleTextarea(newItem);
                        });
                        newItem.textarea.dispatchEvent(new Event('input'));
                        newItem.textarea.focus();
                    });
                })
                .catch((error) => {
                    console.warn(error);
                });
        }
    }
    return true; // Required to indicate that the response is asynchronous
});
