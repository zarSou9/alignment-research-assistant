async function signOut() {
    const response = await chrome.runtime.sendMessage({
        action: 'sign-out',
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

if (session) loginButton.remove();
else signoutButton.remove();
