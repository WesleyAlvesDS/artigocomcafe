<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdminAlert extends Mailable
{
    use Queueable, SerializesModels;

    public array $payload;
    public string $title;

    public function __construct(string $title, array $payload = [])
    {
        $this->title = $title;
        $this->payload = $payload;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '[ALERTA] ' . $this->title . ' — Artigo com Café',
            replyTo: [config('mail.from.address')],
            from: config('mail.from'),
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.admin',
        );
    }
}
