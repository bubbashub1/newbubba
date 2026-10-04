<?php
/**
 * Bubba Hub Google OAuth configuration.
 *
 * IMPORTANT:
 * - Replace the placeholder values on the live server.
 * - Do not commit real client secrets to GitHub.
 * - Prefer environment variables for production credentials.
 */

return [
    'client_id' => getenv('BUBBA_GOOGLE_CLIENT_ID') ?: '',
    'client_secret' => getenv('BUBBA_GOOGLE_CLIENT_SECRET') ?: '',
    'redirect_uri' => getenv('BUBBA_GOOGLE_REDIRECT_URI') ?: '',
    'scopes' => [
        'openid',
        'email',
        'profile',
    ],
];
