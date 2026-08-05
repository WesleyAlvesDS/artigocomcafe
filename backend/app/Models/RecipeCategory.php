<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecipeCategory extends Model
{
    protected $fillable = ['name', 'slug', 'icon', 'color', 'order', 'is_active'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'order' => 'integer',
        ];
    }

    public function recipes()
    {
        return $this->hasMany(Recipe::class, 'category_id');
    }
}
