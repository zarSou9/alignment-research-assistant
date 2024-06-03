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
  if (command === 'open-tab') {
    chrome.tabs.create({ url: 'https://chatgpt.com' });
  } else if (command === 'open-modal') {
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
        console.error('Error sending message to content script:', error);
      }
    })();
  }
});

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
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
          console.log('hello');
          const url = new URL(redirectedTo);
          const params = new URLSearchParams(url.hash.replace('#', ''));

          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: params.get('id_token'),
          });

          chrome.tabs.create({ url: './../../pages/success/index.html' });
        }
      }
    );
  }
  sendResponse({ success: true });
});
