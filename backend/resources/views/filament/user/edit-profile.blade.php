<x-filament-panels::page>
    <div
        x-data="{
            showPassword: false,
            saving: false,
            saved: false,
            async saveForm() {
                this.saving = true;
                await new Promise(r => setTimeout(r, 800));
                this.saving = false;
                this.saved = true;
                setTimeout(() => this.saved = false, 3000);
            }
        }"
        class="max-w-2xl mx-auto space-y-6"
    >
        <div class="text-center" x-data="{ show: false }" x-init="setTimeout(() => show = true, 100)" x-show="show" x-transition.opacity.duration.500ms>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white" style="font-family: 'Cormorant Garamond', serif;">Minha Conta</h1>
            <p class="text-gray-600 dark:text-gray-300 mt-2">Gerencie suas informações pessoais e preferências</p>
        </div>

        <form wire:submit.prevent="save" class="space-y-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6" x-data="{ show: false }" x-init="setTimeout(() => show = true, 200)" x-show="show" x-transition.opacity.duration.600ms>
            <div class="space-y-4">
                <div x-data="{ focused: false }">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                    <input
                        type="text"
                        wire:model="data.name"
                        @focus="focused = true"
                        @blur="focused = false"
                        :class="focused ? 'ring-2 ring-amber-500 border-amber-500' : ''"
                        class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all duration-300"
                        required
                    >
                </div>

                <div x-data="{ focused: false }">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
                    <input
                        type="email"
                        wire:model="data.email"
                        @focus="focused = true"
                        @blur="focused = false"
                        :class="focused ? 'ring-2 ring-amber-500 border-amber-500' : ''"
                        class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all duration-300"
                        required
                    >
                </div>

                <div class="pt-4 border-t border-gray-100 dark:border-gray-700">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                        </svg>
                        Alterar Senha
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div x-data="{ show: false }">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha Atual</label>
                            <div class="relative">
                                <input :type="show ? 'text' : 'password'" wire:model="data.current_password" class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all pr-10">
                                <button type="button" @click="show = !show" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                                    <svg x-show="!show" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                    <svg x-show="show" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                                </button>
                            </div>
                        </div>
                        <div x-data="{ show: false }">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nova Senha</label>
                            <div class="relative">
                                <input :type="show ? 'text' : 'password'" wire:model="data.password" class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all pr-10">
                                <button type="button" @click="show = !show" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                                    <svg x-show="!show" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                    <svg x-show="show" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                                </button>
                            </div>
                        </div>
                        <div class="md:col-span-2" x-data="{ show: false }">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar Nova Senha</label>
                            <div class="relative">
                                <input :type="show ? 'text' : 'password'" wire:model="data.password_confirmation" class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all pr-10">
                                <button type="button" @click="show = !show" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                                    <svg x-show="!show" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                    <svg x-show="show" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button type="button" wire:click="$resetForm" class="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl font-medium transition-all duration-300 hover:scale-105">
                    Cancelar
                </button>
                <button type="submit" class="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-medium rounded-xl transition-all duration-300 shadow-lg shadow-amber-500/25 hover:scale-105 hover:shadow-xl flex items-center gap-2">
                    <template x-if="!saving && !saved">
                        <span class="flex items-center gap-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                            Salvar Alterações
                        </span>
                    </template>
                    <template x-if="saving">
                        <span class="flex items-center gap-2">
                            <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                            Salvando...
                        </span>
                    </template>
                    <template x-if="saved">
                        <span class="flex items-center gap-2">
                            <svg class="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                            Salvo!
                        </span>
                    </template>
                </button>
            </div>
        </form>

        <!-- Danger Zone -->
        <div x-data="{ show: false, confirmDelete: false }" x-init="setTimeout(() => show = true, 400)" x-show="show" x-transition.opacity.duration.700ms class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
            <h3 class="text-lg font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Zona de Perigo
            </h3>
            <p class="text-red-600 dark:text-red-400 mb-4">Uma vez excluída, sua conta não poderá ser recuperada.</p>

            <div x-show="!confirmDelete" x-transition>
                <button @click="confirmDelete = true" class="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105">
                    Excluir Minha Conta
                </button>
            </div>

            <div x-show="confirmDelete" x-transition.scale.origin.top class="bg-red-100 dark:bg-red-900/40 rounded-xl p-4 space-y-3">
                <p class="text-sm font-medium text-red-700 dark:text-red-300">Tem certeza? Esta ação é irreversível.</p>
                <div class="flex gap-2">
                    <button @click="confirmDelete = false" class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                        Cancelar
                    </button>
                    <button wire:click="confirmDelete" class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-500 transition">
                        Sim, excluir minha conta
                    </button>
                </div>
            </div>
        </div>
    </div>
</x-filament-panels::page>
