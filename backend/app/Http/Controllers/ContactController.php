<?php

namespace App\Http\Controllers;

use App\Http\Requests\ContactFormRequest;
use App\Mail\ContactForm;
use App\Mail\AdminAlert;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\JsonResponse;

class ContactController extends Controller
{
    public function send(ContactFormRequest $request): JsonResponse
    {
        // Cloudflare Turnstile verification (se configurado)
        if ($request->has('turnstile_token')) {
            $turnstileSecret = config('services.turnstile.secret');
            if ($turnstileSecret) {
                $verification = Http::asForm()->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                    'secret' => $turnstileSecret,
                    'response' => $request->turnstile_token,
                    'remoteip' => $request->ip(),
                ]);

                if (!$verification->json('success', false)) {
                    return response()->json(['error' => 'Verificação anti-bot falhou. Tente novamente.'], 422);
                }
            }
        }

        // 1. Envia para suporte@
        Mail::to(config('mail.support_address', 'suporte@artigocomcafe.com'))
            ->send(new ContactForm(
                name: $request->name,
                email: $request->email,
                message: $request->message,
                subject: $request->subject
            ));

        // 2. Notifica admin@ (opcional, apenas para assuntos urgentes ou primeiro contato)
        if (str_contains(strtolower($request->subject ?? ''), 'urgente') || str_contains(strtolower($request->message), 'urgente')) {
            Mail::to(config('mail.admin_address', 'admin@artigocomcafe.com'))
                ->send(new AdminAlert('Contato URGENTE do site', [
                    'de' => $request->email,
                    'nome' => $request->name,
                    'mensagem' => $request->message,
                ]));
        }

        return response()->json(['success' => true, 'message' => 'Mensagem enviada com sucesso!']);
    }
}
