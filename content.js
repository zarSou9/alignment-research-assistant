let handleActions;
let interval;
let handleEnter;

function closeModal(container) {
    container.remove();
    document.removeEventListener('keypress', handleEnter);
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
                    const promptListItem = document.getElementById(
                        'extension-prompt-list-item'
                    );
                    const contextPlaceHolder = document.getElementById(
                        'extension-context-place-holder'
                    );
                    const promptPlaceHolder = document.getElementById(
                        'extension-prompt-place-holder'
                    );
                    const listItemContextMenu = document.getElementById(
                        'extension-delete-list-item-div'
                    );
                    const listItemPromptMenu =
                        listItemContextMenu.cloneNode(true);
                    const deleteContextMenuButton = document.getElementById(
                        'extension-delete-list-item-button'
                    );
                    const deletePromptMenuButton =
                        listItemPromptMenu.children[0];
                    const contextListHolder = document.getElementById(
                        'extension-context-list-holder'
                    );
                    const promptListHolder = document.getElementById(
                        'extension-prompt-list-holder'
                    );
                    const signInArrow = document.getElementById(
                        'extension-sign-in-arrow'
                    );
                    const startChatButton = document.getElementById(
                        'ext-start-chat-button'
                    );
                    const pdfEmbed = document.querySelector(
                        'embed[type="application/pdf"]'
                    );

                    const contextList = [];
                    const promptList = [];
                    let deleteListItem;
                    let unSaved = false;
                    let selectedContext;
                    let selectedPrompt;

                    promptNav.style.fontWeight = '700';

                    contextCheck.remove();
                    promptCheck.remove();
                    contextListItem.remove();
                    promptListItem.remove();
                    contextPlaceHolder.remove();
                    promptPlaceHolder.remove();
                    listItemContextMenu.remove();
                    signInArrow.remove();
                    contextEdit.disabled = true;
                    promptEdit.disabled = true;
                    contextEdit.children[0].style.stroke = '#000000';

                    async function updateLists() {
                        const response = await chrome.runtime.sendMessage({
                            action: 'update-lists',
                            contextList,
                            promptList,
                            pdf: !!pdfEmbed,
                        });
                        if (response?.signedOut) closeModal(container);
                    }

                    modal.addEventListener('click', (e) => {
                        listItemContextMenu.remove();
                        listItemPromptMenu.remove();
                        e.stopPropagation();
                    });
                    modalBackground.addEventListener('click', () => {
                        closeModal(container);
                    });
                    deleteContextMenuButton.addEventListener('click', () => {
                        deleteListItem.element.remove();
                        contextList.splice(
                            contextList.findIndex(
                                (v) => v.id === deleteListItem.id
                            ),
                            1
                        );
                        updateLists();
                    });
                    deletePromptMenuButton.addEventListener('click', () => {
                        deleteListItem.element.remove();
                        promptList.splice(
                            promptList.findIndex(
                                (v) => v.id === deleteListItem.id
                            ),
                            1
                        );
                        updateLists();
                    });

                    contextEdit.addEventListener('click', () => {
                        contextEdit.remove();
                        contextBox.appendChild(contextCheck);
                        contextList.forEach((li) => {
                            li.element.disabled = true;
                            li.textarea.style.pointerEvents = 'all';
                        });
                        contextListHolder.appendChild(contextPlaceHolder);
                    });
                    contextCheck.addEventListener('click', () => {
                        contextCheck.remove();
                        contextPlaceHolder.remove();
                        contextBox.appendChild(contextEdit);
                        contextList.forEach((li) => {
                            li.element.disabled = false;
                            li.textarea.style.pointerEvents = 'none';
                        });
                    });

                    promptEdit.addEventListener('click', () => {
                        promptEdit.remove();
                        promptBox.appendChild(promptCheck);
                        promptList.forEach((li) => {
                            li.element.disabled = true;
                            li.textarea.style.pointerEvents = 'all';
                        });
                        promptListHolder.appendChild(promptPlaceHolder);
                    });
                    promptCheck.addEventListener('click', () => {
                        promptCheck.remove();
                        promptPlaceHolder.remove();
                        promptBox.appendChild(promptEdit);
                        promptList.forEach((li) => {
                            li.element.disabled = false;
                            li.textarea.style.pointerEvents = 'none';
                        });
                    });

                    function handleTextarea(li) {
                        li.textarea.style.height = 'auto';
                        li.textarea.style.height =
                            li.textarea.scrollHeight + 'px';
                        li.text = li.textarea.value;
                    }

                    contextPlaceHolder.addEventListener('click', () => {
                        createContextListItem().textarea.focus();
                        updateLists();
                    });
                    promptPlaceHolder.addEventListener('click', () => {
                        createPromptListItem().textarea.focus();
                        updateLists();
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
                        newItem.textarea.addEventListener('keypress', (e) => {
                            e.stopPropagation();
                        });

                        if (before) {
                            newItem.element.disabled = true;
                            newItem.textarea.style.pointerEvents = 'all';
                        }
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

                    function createPromptListItem(
                        id = Math.random().toString(),
                        text = '',
                        before = true
                    ) {
                        const newItem = {
                            element: promptListItem.cloneNode(true),
                            id,
                            text,
                        };
                        promptList.push(newItem);
                        if (before) {
                            promptListHolder.insertBefore(
                                newItem.element,
                                promptPlaceHolder
                            );
                        } else {
                            promptListHolder.appendChild(newItem.element);
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
                        newItem.textarea.addEventListener('keypress', (e) => {
                            e.stopPropagation();
                        });

                        if (before) {
                            newItem.element.disabled = true;
                            newItem.textarea.style.pointerEvents = 'all';
                        }
                        newItem.element.addEventListener('click', () => {
                            if (selectedPrompt) {
                                selectedPrompt.element.children[0].children[0].style.background =
                                    'none';
                            }
                            if (selectedPrompt === newItem) {
                                newItem.element.children[0].children[0].style.background =
                                    'none';
                                selectedPrompt = undefined;
                            } else {
                                newItem.element.children[0].children[0].style.background =
                                    '#2bb8f4';
                                selectedPrompt = newItem;
                            }
                        });
                        newItem.element.addEventListener('contextmenu', (e) => {
                            e.preventDefault();
                            deleteListItem = newItem;
                            modal.appendChild(listItemPromptMenu);
                            listItemPromptMenu.style.left =
                                e.clientX.toString() + 'px';
                            listItemPromptMenu.style.top =
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

                        response?.dbLists?.prompts?.forEach((prompt) => {
                            createPromptListItem(prompt.id, prompt.text, false);
                        });
                        promptEdit.disabled = false;
                    }

                    interval = setInterval(() => {
                        if (unSaved) {
                            unSaved = false;
                            updateLists();
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

                                response?.dbLists?.prompts?.forEach(
                                    (prompt) => {
                                        createPromptListItem(
                                            prompt.id,
                                            prompt.text,
                                            false
                                        );
                                    }
                                );
                                promptEdit.disabled = false;
                                signInArrow.remove();
                            }
                        } else if (request.action === 'handle-sign-out') {
                            closeModal(container);
                        }
                    };

                    chrome.runtime.onMessage.addListener(handleActions);

                    if (pdfEmbed) {
                        const pdfUrl = window.location.href;
                        const response = await chrome.runtime.sendMessage({
                            action: 'downloadPDF',
                            url: pdfUrl,
                        });
                    }

                    function goToGPT() {
                        const pdfUrl = window.location.href;
                        chrome.runtime.sendMessage({
                            action: 'go-to-gpt',
                            context: selectedContext?.text,
                            prompt: selectedPrompt?.text,
                            pdf: pdfUrl,
                        });
                    }
                    startChatButton.addEventListener('click', goToGPT);
                    handleEnter = (e) => {
                        if (e.key === 'Enter') {
                            goToGPT();
                        }
                    };
                    document.addEventListener('keypress', handleEnter);
                })
                .catch((error) => {
                    console.warn(error);
                });
        }
    }
    return true; // Required to indicate that the response is asynchronous
});
