<?php

namespace App\Filament\Resources\Articles\Pages;

use App\Filament\Resources\Articles\ArticleResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;
use Livewire\Attributes\On;

class ListArticles extends ListRecords
{
    protected static string $resource = ArticleResource::class;

    #[On('refreshArticles')]
    public function refreshTable(): void
    {
        $this->resetTable();
    }

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make()
                ->slideOver()
                ->modalWidth('5xl')
                ->createAnother(false)
                ->successNotificationTitle('Artigo criado com sucesso!')
                ->after(fn () => $this->dispatch('refreshArticles')),
        ];
    }
}
