/**
 * Bubba Hub Google Sign-In placeholder.
 *
 * The buttons can be added to login/register pages now.
 * OAuth will be enabled after the Google Cloud client is configured.
 */

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-google-signin]').forEach((button) => {
    button.addEventListener('click', () => {
      alert('Google Sign-In will be available once Google OAuth is configured.');
    });
  });
});
