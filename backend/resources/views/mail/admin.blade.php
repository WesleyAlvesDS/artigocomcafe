@component('mail::message')
# ⚠️ Alerta do Sistema — Artigo com Café

{{ $title }}

@foreach ($payload as $key => $value)
**{{ ucfirst(str_replace('_', ' ', $key)) }}:** {{ is_array($value) ? json_encode($value) : $value }}

@endforeach

---
Este alerta foi gerado automaticamente pelo painel administrativo.
@endcomponent