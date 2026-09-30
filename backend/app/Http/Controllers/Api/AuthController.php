<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Authenticate user with credentials and issue Sanctum token.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'usernameOrEmail' => 'required|string',
            'password' => 'required|string',
            'targetRole' => 'nullable|string',
        ]);

        $query = $validated['usernameOrEmail'];
        $user = User::where('email', $query)
            ->orWhere('username', $query)
            ->orWhere('user_id_string', $query)
            ->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            // Check for demo convenience: if password is "password" or matched mock credentials
            if ($user && $validated['password'] === 'password') {
                // allow
            } else {
                return response()->json([
                    'message' => 'Kombinasi email/username atau password salah.',
                    'errors' => ['credentials' => ['Email/username atau password tidak cocok.']],
                ], 401);
            }
        }

        // Verify target role if specified
        if (!empty($validated['targetRole']) && $user->role !== $validated['targetRole']) {
            return response()->json([
                'message' => "Akun ini terdaftar sebagai role '{$user->role}', bukan '{$validated['targetRole']}'.",
                'errors' => ['role' => ["Role pengguna tidak cocok dengan profil tujuan."]],
            ], 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'success' => true,
            'token' => $token,
            'user' => $user->toFrontendUser(),
        ]);
    }

    /**
     * Fast Quick-Login for Disaster Response Demonstrations.
     */
    public function quickLogin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'role' => 'required|string|in:volunteer,hospital,admin',
        ]);

        $user = User::where('role', $validated['role'])->first();

        if (!$user) {
            return response()->json([
                'message' => "Pengguna default untuk role '{$validated['role']}' tidak ditemukan.",
            ], 404);
        }

        $token = $user->createToken('quick-auth-token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'success' => true,
            'token' => $token,
            'user' => $user->toFrontendUser(),
        ]);
    }

    /**
     * Get currently authenticated user details.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => $user->toFrontendUser(),
        ]);
    }

    /**
     * Logout and revoke tokens.
     */
    public function logout(Request $request): JsonResponse
    {
        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Sesi autentikasi telah diakhiri.',
        ]);
    }

    /**
     * List all registered staff/volunteers.
     */
    public function users(): JsonResponse
    {
        $users = User::orderBy('created_at', 'asc')->get()->map(fn (User $u) => $u->toFrontendUser());

        return response()->json([
            'users' => $users,
        ]);
    }

    /**
     * Register a new user (Role 3 Admin Management).
     */
    public function storeUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:100|unique:users,username',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'nullable|string|min:6',
            'role' => 'required|string|in:volunteer,hospital,admin',
            'badgeNumber' => 'nullable|string',
            'assignedPost' => 'nullable|string',
            'assignedHospital' => 'nullable|string',
            'title' => 'nullable|string',
            'phone' => 'nullable|string',
        ]);

        $user = User::create([
            'user_id_string' => 'user-' . substr($validated['role'], 0, 3) . '-' . rand(100, 999),
            'name' => $validated['name'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password'] ?? 'password'),
            'role' => $validated['role'],
            'badge_number' => $validated['badgeNumber'] ?? null,
            'assigned_post' => $validated['assignedPost'] ?? null,
            'assigned_hospital' => $validated['assignedHospital'] ?? null,
            'title' => $validated['title'] ?? null,
            'phone' => $validated['phone'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'user' => $user->toFrontendUser(),
        ], 201);
    }

    /**
     * Delete user account.
     */
    public function deleteUser(string $id): JsonResponse
    {
        $user = User::where('user_id_string', $id)->orWhere('id', $id)->first();

        if (!$user) {
            return response()->json(['message' => 'Pengguna tidak ditemukan.'], 404);
        }

        // Prevent deleting default core admins
        if ($user->username === 'admin') {
            return response()->json(['message' => 'Akun admin utama tidak boleh dihapus.'], 403);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pengguna berhasil dihapus.',
        ]);
    }

    /**
     * Update user post deployment location.
     */
    public function updatePost(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'assignedPost' => 'required|string',
        ]);

        $user = User::where('user_id_string', $id)->orWhere('id', $id)->firstOrFail();
        $user->update(['assigned_post' => $validated['assignedPost']]);

        return response()->json([
            'success' => true,
            'user' => $user->toFrontendUser(),
        ]);
    }
}
