{{-- ═══════════════════════════════════════════════════════════════
     SUPER APP LOGIN — Filament v4 Compatible
     Uses simple page layout from Filament
     ═══════════════════════════════════════════════════════════════ --}}

<x-filament-panels::page.simple
    
    class="fi-page-login"
>
    <div class="flex flex-col items-center justify-center min-h-[60vh]"
         x-data="{ show: false }"
         x-init="setTimeout(() => show = true, 200)"
         x-show="show"
         x-transition:enter="transition ease-out duration-500"
         x-transition:enter-start="opacity-0 translate-y-4"
         x-transition:enter-end="opacity-100 translate-y-0">

        {{-- Brand --}}
        <div class="text-center mb-8">
            <div class="w-20 h-20 bg-gradient-to-br from-amber-600 to-orange-700 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg shadow-amber-500/30">
                ☕
            </div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white" style="font-family: 'Cormorant Garamond', serif;">
                Bem-vindo de volta
            </h1>
            <p class="text-gray-500 dark:text-gray-400 mt-2">
                O café é o convite, a leitura é o destino
            </p>
        </div>

        {{-- Form --}}
        <div class="w-full max-w-md">
            <form wire:submit="authenticate" class="space-y-5">
                {{ $this->form }}

                <button
                    type="submit"
                    class="w-full px-6 py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all duration-300 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    Entrar e ganhar +10 ☕
                </button>
            </form>

            {{-- Register link --}}
            @if (filament()->hasRegistration())
                <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                    Ainda não tem conta?
                    <a href="{{ filament()->getRegistrationUrl() }}" class="font-bold text-amber-600 dark:text-amber-400 hover:underline">
                        Comece sua jornada
                    </a>
                </p>
            @endif

            {{-- Forgot password --}}
            @if (filament()->hasPasswordReset())
                <p class="text-center text-sm mt-3">
                    <a href="{{ filament()->getPasswordResetUrl() }}" class="text-gray-400 dark:text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                        Esqueceu a senha?
                    </a>
                </p>
            @endif
        </div>
    </div>
</x-filament-panels::page.simple>
