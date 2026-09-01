<?php

namespace App\Filament\User\Resources\CommentResource\Pages;

use App\Filament\User\Resources\CommentResource;
use Filament\Resources\Pages\ListRecords;

class ListComments extends ListRecords
{
    protected static string $resource = CommentResource::class;
}