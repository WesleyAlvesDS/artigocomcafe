<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Artigo com Café — Super App
| Interceptores de rota para redirecionar /app para o painel Filament.
|
*/

// ── Página inicial (welcome) ─────────────────────────────────
Route::get('/', function () {
    return view('welcome');
});

// ── Interceptores de rota para o Super App ────────────────────
// Redireciona /app para o painel Filament
Route::get('/app', function () {
    return redirect('/app/');
});

Route::get('/app/', function () {
    // Deixa o Filament resolver internamente
    if (auth()->check()) {
        return redirect('/app/home-feed');
    }
    return redirect('/app/login');
});

// ── Rotas de conveniência (atalhos) ──────────────────────────
Route::get('/dashboard', fn () => redirect('/app/'));
Route::get('/login', fn () => redirect('/app/login'));
Route::get('/register', fn () => redirect('/app/register'));

// ── Rotas de logout ──────────────────────────────────────────
Route::post('/logout', function () {
    auth()->logout();
    session()->invalidate();
    session()->regenerateToken();
    return redirect('/');
})->name('logout');

// ── Health check ─────────────────────────────────────────────
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'Artigo com Café',
        'timestamp' => now()->toISOString(),
    ]);
});
