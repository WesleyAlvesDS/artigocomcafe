<?php

namespace App\Filament\User\Widgets;

use Filament\Widgets\Widget;

class NewsletterWidget extends Widget
{
    protected static ?int $sort = 50;
    protected string $view = 'filament.user.widgets.newsletter-widget';
}
