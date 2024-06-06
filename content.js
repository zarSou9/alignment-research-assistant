let handleActions;
let interval;

function closeModal(container) {
    container.remove();
    chrome.runtime.onMessage.removeListener(handleActions);
    clearInterval(interval);
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === 'toggle-modal') {
        const extension = document.getElementById('extension-container');
        if (extension) {
            closeModal(extension);
        } else {
            fetch(chrome.runtime.getURL('components/modal/index.html'))
                .then((response) => response.text())
                .then(async (html) => {
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
                    const listItemContextMenu = document.getElementById(
                        'extension-delete-list-item-div'
                    );
                    const deleteContextMenuButton = document.getElementById(
                        'extension-delete-list-item-button'
                    );
                    const contextListHolder = document.getElementById(
                        'extension-context-list-holder'
                    );
                    const signInArrow = document.getElementById(
                        'extension-sign-in-arrow'
                    );

                    const contextList = [];
                    let deleteListItem;
                    let unSaved = false;
                    let selectedContext;

                    promptNav.style.fontWeight = '700';

                    contextCheck.remove();
                    contextListItem.remove();
                    contextPlaceHolder.remove();
                    listItemContextMenu.remove();
                    signInArrow.remove();
                    contextEdit.disabled = true;
                    contextEdit.children[0].style.stroke = '#000000';

                    async function updateContext() {
                        const response = await chrome.runtime.sendMessage({
                            action: 'update-context',
                            contextList,
                        });
                        if (response?.signedOut) closeModal(container);
                    }

                    modal.addEventListener('click', (e) => {
                        listItemContextMenu.remove();
                        e.stopPropagation();
                    });
                    modalBackground.addEventListener('click', () => {
                        closeModal(container);
                    });
                    deleteContextMenuButton.addEventListener(
                        'click',
                        async () => {
                            deleteListItem.element.remove();
                            contextList.splice(
                                contextList.findIndex(
                                    (v) => v.id === deleteListItem.id
                                ),
                                1
                            );
                            await updateContext();
                        }
                    );

                    contextEdit.addEventListener('click', () => {
                        contextEdit.remove();
                        contextBox.appendChild(contextCheck);
                        contextList.forEach((li) => {
                            li.textarea.style.pointerEvents = 'all';
                        });
                        contextListHolder.appendChild(contextPlaceHolder);
                    });
                    contextCheck.addEventListener('click', () => {
                        contextCheck.remove();
                        contextPlaceHolder.remove();
                        contextBox.appendChild(contextEdit);
                        contextList.forEach((li) => {
                            li.textarea.style.pointerEvents = 'none';
                        });
                    });

                    function handleTextarea(li) {
                        li.textarea.style.height = 'auto';
                        li.textarea.style.height =
                            li.textarea.scrollHeight + 'px';
                        li.text = li.textarea.value;
                    }

                    contextPlaceHolder.addEventListener('click', async () => {
                        createContextListItem().textarea.focus();
                        await updateContext();
                    });
                    function createContextListItem(
                        id = Math.random().toString(),
                        text = '',
                        before = true
                    ) {
                        const newItem = {
                            element: contextListItem.cloneNode(true),
                            id,
                            text,
                        };
                        contextList.push(newItem);
                        if (before) {
                            contextListHolder.insertBefore(
                                newItem.element,
                                contextPlaceHolder
                            );
                        } else {
                            contextListHolder.appendChild(newItem.element);
                        }

                        newItem.element.id = newItem.id;
                        newItem.textarea = newItem.element.children[1];
                        newItem.textarea.addEventListener('input', () => {
                            handleTextarea(newItem);
                            unSaved = true;
                        });
                        newItem.textarea.addEventListener('click', (e) => {
                            e.stopPropagation();
                        });
                        newItem.element.addEventListener('click', () => {
                            if (selectedContext) {
                                selectedContext.element.children[0].children[0].style.background =
                                    'none';
                            }
                            if (selectedContext === newItem) {
                                newItem.element.children[0].children[0].style.background =
                                    'none';
                                selectedContext = undefined;
                            } else {
                                newItem.element.children[0].children[0].style.background =
                                    '#2bb8f4';
                                selectedContext = newItem;
                            }
                        });
                        newItem.element.addEventListener('contextmenu', (e) => {
                            e.preventDefault();
                            deleteListItem = newItem;
                            modal.appendChild(listItemContextMenu);
                            listItemContextMenu.style.left =
                                e.clientX.toString() + 'px';
                            listItemContextMenu.style.top =
                                e.clientY.toString() + 'px';
                        });
                        newItem.textarea.value = text;
                        newItem.textarea.dispatchEvent(new Event('input'));
                        return newItem;
                    }
                    const response = await chrome.runtime.sendMessage({
                        action: 'get-lists',
                    });

                    if (response?.signedOut) {
                        modalBackground.appendChild(signInArrow);
                    } else {
                        response?.dbLists?.contexts?.forEach((context) => {
                            createContextListItem(
                                context.id,
                                context.text,
                                false
                            );
                        });
                        contextEdit.disabled = false;
                    }

                    interval = setInterval(() => {
                        if (unSaved) {
                            unSaved = false;
                            updateContext();
                        }
                    }, 200);

                    handleActions = async (request) => {
                        if (request.action === 'handle-sign-in') {
                            const response = await chrome.runtime.sendMessage({
                                action: 'get-lists',
                            });
                            if (!response?.signedOut) {
                                response?.dbLists?.contexts?.forEach(
                                    (context) => {
                                        createContextListItem(
                                            context.id,
                                            context.text,
                                            false
                                        );
                                    }
                                );
                                contextEdit.disabled = false;
                                signInArrow.remove();
                            }
                        } else if (request.action === 'handle-sign-out') {
                            closeModal(container);
                        }
                    };

                    chrome.runtime.onMessage.addListener(handleActions);
                })
                .catch((error) => {
                    console.warn(error);
                });
        }
    }
    return true; // Required to indicate that the response is asynchronous
});
