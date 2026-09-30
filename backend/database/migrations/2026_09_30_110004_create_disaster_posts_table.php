<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('disaster_posts', function (Blueprint $table) {
            $table->string('id')->primary(); // 'posko-a', 'posko-b', 'posko-c', 'posko-d'
            $table->string('name')->unique(); // 'Posko A', 'Posko B', 'Posko C', 'Posko D'
            $table->decimal('lat', 10, 7);
            $table->decimal('lng', 10, 7);
            $table->string('sector');
            $table->string('coordinator');
            $table->integer('active_volunteers')->default(0);
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('disaster_posts');
    }
};
