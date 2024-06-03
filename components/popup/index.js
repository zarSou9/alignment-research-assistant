import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseKey } from './../../supa_creds';
const supabase = createClient(supabaseUrl, supabaseKey);

async function signOut() {
  signoutButton.disabled = true;
  await supabase.auth.signOut();
  await chrome.storage.local.set({
    session: null,
  });
  signoutButton.remove();
  container.appendChild(loginButton);
}

const loginButton = document.getElementById('login_button');
const signoutButton = document.getElementById('signout_button');
const container = document.getElementById('container');

loginButton.addEventListener('click', () => {
  chrome.runtime.sendMessage({
    action: 'sign-in-with-google',
  });
});
signoutButton.addEventListener('click', signOut);

const { session } = await chrome.storage.local.get('session');
console.log(session);

if (session) loginButton.remove();
else signoutButton.remove();
