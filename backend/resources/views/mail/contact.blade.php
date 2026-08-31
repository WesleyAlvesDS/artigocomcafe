@component('mail::message')
# Nova Mensagem de Contato

**De:** {{ $name }} ({{ $email }})

@unless(empty($subject))
**Assunto:** {{ $subject }}
@endunless

**Mensagem:**
{{ $message }}

---
Este e-mail foi enviado do formulário de contato do site.
@endcomponent