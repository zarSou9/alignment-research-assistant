import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseKey } from './supa_creds';
const supabase = createClient(supabaseUrl, supabaseKey);

const { session } = await chrome.storage.local.get('session');

if (session) await supabase.auth.setSession(session);

const { data, error } = await supabase.auth.getSession();

if (error || !data?.session) {
    await chrome.storage.local.set({
        session: null,
    });
} else {
    const newSession = data.session;

    await chrome.storage.local.set({
        session: {
            access_token: newSession.access_token,
            refresh_token: newSession.refresh_token,
        },
    });
}

supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
        const { user } = session;

        await chrome.storage.local.set({
            session: {
                access_token: session.access_token,
                refresh_token: session.refresh_token,
            },
        });
        // Check if user data exists in your custom user table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (userError && userError.code === 'PGRST116') {
            // If user data does not exist, insert it
            const { error: insertError } = await supabase.from('users').insert([
                {
                    id: user.id,
                    email: user.email,
                    full_name: user.user_metadata.full_name,
                    avatar_url: user.user_metadata.avatar_url,
                },
            ]);

            if (insertError) {
                return;
            }
        }
    }
});

chrome.commands.onCommand.addListener((command) => {
    if (command === 'open-modal') {
        (async () => {
            try {
                const [tab] = await chrome.tabs.query({
                    active: true,
                    lastFocusedWindow: true,
                });

                if (tab) {
                    const response = await chrome.tabs.sendMessage(tab.id, {
                        action: 'toggle-modal',
                    });
                } else {
                    console.error('No active tab found');
                }
            } catch (error) {
                console.error(
                    'Error sending message to content script:',
                    error
                );
            }
        })();
    } else if (command === 'open-gpt') {
        chrome.tabs.create({ url: 'https://chatgpt.com' });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'sign-in-with-google') {
        chrome.identity.launchWebAuthFlow(
            {
                url: `https://accounts.google.com/o/oauth2/auth?client_id=${chrome.runtime.getManifest().oauth2.client_id}&response_type=id_token&redirect_uri=https://${chrome.runtime.id}.chromiumapp.org/&scope=${chrome.runtime.getManifest().oauth2.scopes.join(' ')}&prompt=consent`,
                interactive: true,
            },
            async (redirectedTo) => {
                if (chrome.runtime.lastError) {
                    // auth was not successful
                } else {
                    const url = new URL(redirectedTo);
                    const params = new URLSearchParams(
                        url.hash.replace('#', '')
                    );

                    const { data, error } =
                        await supabase.auth.signInWithIdToken({
                            provider: 'google',
                            token: params.get('id_token'),
                        });

                    chrome.tabs.create({
                        url: './../../pages/success/index.html',
                    });

                    chrome.tabs.query({}, (tabs) => {
                        tabs.forEach((tab) => {
                            chrome.tabs.sendMessage(tab.id, {
                                action: 'handle-sign-in',
                            });
                        });
                    });
                }
            }
        );
    } else if (request.action === 'sign-out') {
        supabase.auth.signOut().then(() => {
            chrome.storage.local.set({
                session: null,
            });
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach((tab) => {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'handle-sign-out',
                    });
                });
            });
            sendResponse({ signedOut: true });
        });
    } else if (request.action === 'update-lists') {
        supabase.auth.getSession().then(({ data }) => {
            if (!data?.session) {
                supabase.auth.signOut().then(() => {
                    sendResponse({ signedOut: true });
                });
                return true;
            }
            request.contextList.forEach((context) => {
                delete context.element;
                delete context.textarea;
            });
            request.promptList.forEach((prompt) => {
                delete prompt.element;
                delete prompt.textarea;
            });
            supabase
                .from('users')
                .update({
                    contexts: request.contextList,
                    prompts: request.promptList,
                })
                .eq('id', data.session.user.id)
                .then(() => {
                    // handle successful update
                })
                .catch((error) => {
                    // handle error
                });
        });
    } else if (request.action === 'get-lists') {
        supabase.auth.getSession().then(({ data }) => {
            if (!data?.session) {
                sendResponse({ signedOut: true });
            } else {
                supabase
                    .from('users')
                    .select('contexts, prompts')
                    .eq('id', data.session.user.id)
                    .then(({ data: listData }) => {
                        sendResponse({ dbLists: listData[0] });
                    });
            }
        });
    } else if (request.action === 'go-to-gpt') {
        chrome.tabs.create({ url: 'https://chatgpt.com' }, (tab) => {
            setTimeout(() => {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'dump-prompt',
                    context: request.context,
                    prompt: request.prompt,
                    pdf: request.pdf,
                });
            }, 1000);
        });
    } else if (request.action === 'downloadPDF') {
        fetch(request.url)
            .then((response) => response.blob())
            .then((blob) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64data = reader.result.split(',')[1];
                    chrome.storage.local.set(
                        { downloadedFile: base64data },
                        () => sendResponse({ success: true })
                    );
                };
                reader.readAsDataURL(blob);
            });
    }
    return true;
});
