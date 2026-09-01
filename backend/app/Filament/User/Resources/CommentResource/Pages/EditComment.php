<?php

namespace App\Filament\User\Resources\CommentResource\Pages;

use App\Filament\User\Resources\CommentResource\CommentResource;
use Filament\Resources\Pages\EditRecord;

class EditComment extends EditRecord
{
    protected static string $resource = CommentResource::class;
}