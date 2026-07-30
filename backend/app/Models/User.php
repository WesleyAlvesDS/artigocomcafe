<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'username', 'bio', 'avatar', 'theme'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_login_at' => 'datetime',
            'last_visit_date' => 'date',
        ];
    }

    public function collections()
    {
        return $this->hasMany(Collection::class)->orderBy('order');
    }

    public function readingProgress()
    {
        return $this->hasMany(ReadingProgress::class);
    }

    public function grains()
    {
        return $this->hasMany(Grain::class);
    }

    public function achievements()
    {
        return $this->belongsToMany(Achievement::class, 'user_achievement')
            ->withPivot('earned_at')
            ->orderBy('user_achievement.earned_at', 'desc');
    }

    public function trails()
    {
        return $this->belongsToMany(Trail::class, 'user_trail')
            ->withPivot(['progress', 'is_completed', 'started_at', 'completed_at']);
    }

    public function missions()
    {
        return $this->belongsToMany(Mission::class, 'user_mission')
            ->withPivot(['progress', 'target', 'is_completed', 'completed_at', 'assigned_date']);
    }

    public function dailyVisits()
    {
        return $this->hasMany(DailyVisit::class);
    }

    public function articles()
    {
        return $this->hasMany(Article::class, 'user_id');
    }

    public function rewards()
    {
        return $this->belongsToMany(Reward::class, 'user_reward')
            ->withPivot(['is_active', 'unlocked_at', 'activated_at'])
            ->orderBy('user_reward.unlocked_at', 'desc');
    }

    public function getTotalGrainsAttribute()
    {
        return $this->grains()
            ->where('type', 'earned')
            ->sum('amount') - $this->grains()
            ->where('type', 'spent')
            ->sum('amount');
    }

    public function getCompletedTrailsCountAttribute()
    {
        return $this->trails()->where('is_completed', true)->count();
    }

    public function getAchievementsCountAttribute()
    {
        return $this->achievements()->count();
    }

    public function getCategoriesExploredCountAttribute()
    {
        return $this->readingProgress()
            ->where('is_completed', true)
            ->join('articles', 'reading_progress.article_id', '=', 'articles.id')
            ->distinct('articles.category_id')
            ->count('articles.category_id');
    }
}
