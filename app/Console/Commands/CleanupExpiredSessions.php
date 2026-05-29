<?php

namespace App\Console\Commands;

use App\Models\UserSession;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanupExpiredSessions extends Command
{
    /**
     * Command name and signature.
     *
     * @var string
     */
    protected $signature = 'sessions:cleanup {--days=30 : Number of days of inactivity to consider expired}';

    /**
     * Command description.
     *
     * @var string
     */
    protected $description = 'Remove expired and inactive user sessions from the database';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $days = (int) $this->option('days');
        $cutoff = now()->subDays($days);

        // Count before cleanup
        $totalBefore = UserSession::count();
        $revokedCount = UserSession::whereNotNull('revoked_at')->count();
        $inactiveCount = UserSession::active()->where('last_active_at', '<', $cutoff)->count();

        // Delete revoked sessions
        $deletedRevoked = UserSession::whereNotNull('revoked_at')->delete();

        // Delete inactive sessions (older than cutoff)
        $deletedInactive = UserSession::active()
            ->where('last_active_at', '<', $cutoff)
            ->delete();

        $totalAfter = UserSession::count();
        $totalDeleted = $deletedRevoked + $deletedInactive;

        $this->info("Session cleanup completed:");
        $this->line("  - Revoked sessions deleted: {$deletedRevoked}");
        $this->line("  - Inactive sessions ({$days}+ days) deleted: {$deletedInactive}");
        $this->line("  - Sessions before: {$totalBefore}");
        $this->line("  - Sessions after: {$totalAfter}");

        return Command::SUCCESS;
    }
}