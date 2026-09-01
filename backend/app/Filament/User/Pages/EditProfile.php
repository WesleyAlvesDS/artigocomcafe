<?php

namespace App\Filament\User\Pages;

use BackedEnum;
use Filament\Pages\Page;

class EditProfile extends Page
{
    protected string $view = 'filament.user.edit-profile';

    protected static ?string $title = 'Meu Perfil';
    protected static BackedEnum|string|null $navigationIcon = 'heroicon-o-user';
    protected static ?string $navigationLabel = 'Perfil';
    protected static ?int $navigationSort = 100;
}
