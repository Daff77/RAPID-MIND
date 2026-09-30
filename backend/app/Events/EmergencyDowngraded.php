<?php

namespace App\Events;

use App\Models\EmergencyAlert;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class EmergencyDowngraded implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public EmergencyAlert $emergency;

    public function __construct(EmergencyAlert $emergency)
    {
        $this->emergency = $emergency;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('emergencies'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'emergency.downgraded';
    }

    public function broadcastWith(): array
    {
        return [
            'emergency' => $this->emergency->toFrontendArray(),
        ];
    }
}
