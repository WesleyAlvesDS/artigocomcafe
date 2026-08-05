<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Integrações de API externas (Fase 6 - planoapi.md)
    |--------------------------------------------------------------------------
    |
    | As chaves podem ser definidas no .env ou via tabela de settings
    | (gerenciada na página "Integrações" do Dashboard).
    |
    */

    'guardian' => [
        'key' => env('GUARDIAN_API_KEY', 'test'),
    ],

    'currents' => [
        'key' => env('CURRENTS_API_KEY'),
    ],

    'gnews' => [
        'key' => env('GNEWS_API_KEY'),
    ],

    'unsplash' => [
        'key' => env('UNSPLASH_API_KEY'),
    ],

    'openverse' => [
        'client_id' => env('OPENVERSE_CLIENT_ID'),
        'client_secret' => env('OPENVERSE_CLIENT_SECRET'),
    ],

    'ipinfo' => [
        'token' => env('IPINFO_TOKEN'),
    ],

    'groq' => [
        'key' => env('GROQ_API_KEY'),
    ],

    'gemini' => [
        'key' => env('GEMINI_API_KEY'),
    ],

];
