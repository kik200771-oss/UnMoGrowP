<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { api } from '$lib/api/client';

  // Svelte 5 Runes API - form state
  let token = $state('');
  let email = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  let success = $state<string | null>(null);
  let tokenValid = $state<boolean | null>(null);

  // Get token from URL parameters
  onMount(async () => {
    const urlToken = $page.url.searchParams.get('token');
    if (!urlToken) {
      error = 'Invalid reset link. Please request a new password reset.';
      return;
    }

    token = urlToken;

    // Verify the token
    try {
      const response = await api.verifyResetToken(token);
      if (response.success && response.data) {
        tokenValid = true;
        email = response.data.email;
      } else {
        tokenValid = false;
        error = response.error || 'Invalid or expired reset token.';
      }
    } catch (err) {
      tokenValid = false;
      error = 'Failed to verify reset token. Please request a new password reset.';
    }
  });

  async function handleSubmit(e: Event) {
    e.preventDefault();

    // Reset states
    isLoading = true;
    error = null;
    success = null;

    try {
      // Validate passwords
      if (newPassword.length < 8) {
        error = 'Password must be at least 8 characters long';
        return;
      }

      if (newPassword !== confirmPassword) {
        error = 'Passwords do not match';
        return;
      }

      // Call reset password API
      const response = await api.resetPassword(token, newPassword);

      if (response.success) {
        success = response.message || 'Password reset successfully!';

        // Redirect to login after 3 seconds
        setTimeout(() => {
          goto('/login');
        }, 3000);
      } else {
        error = response.error || 'Failed to reset password. Please try again.';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'An unexpected error occurred';
    } finally {
      isLoading = false;
    }
  }

  function handleBackToLogin() {
    goto('/login');
  }

  function handleRequestNewReset() {
    goto('/forgot-password');
  }
</script>

<div class="min-h-screen flex items-center justify-center p-5" style="background: rgb(109, 140, 248);">
  <div class="w-full max-w-[420px]">
    <!-- Logo -->
    <div class="text-center mb-12 flex items-center justify-center gap-0 relative">
      <!-- Background Circle -->
      <div class="absolute w-[140px] h-[140px] rounded-full left-1/2 -translate-x-full z-0" style="background: rgba(255, 255, 255, 0.15);"></div>

      <span class="text-white text-[42px] font-bold tracking-tight relative z-[1]">UnMo</span>

      <!-- White Circle with GrowP -->
      <div class="w-[140px] h-[140px] bg-white rounded-full inline-flex items-center justify-center shadow-[0_10px_25px_rgba(0,0,0,0.1)] relative z-[2]">
        <span class="text-[42px] font-bold tracking-tight" style="color: rgb(109, 140, 248);">GrowP</span>
      </div>
    </div>

    <!-- Reset Password Card -->
    <div class="bg-white rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.15)] p-12">
      {#if tokenValid === null}
        <!-- Loading state -->
        <div class="text-center">
          <div class="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p class="text-sm text-[#4a5568]">Verifying reset token...</p>
        </div>
      {:else if tokenValid === false}
        <!-- Invalid token -->
        <div class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>

          <h1 class="text-lg font-normal text-[#1a202c] mb-4">
            Invalid Reset Link
          </h1>

          {#if error}
            <p class="text-sm text-red-600 mb-6">
              {error}
            </p>
          {/if}

          <div class="space-y-3">
            <button
              type="button"
              onclick={handleRequestNewReset}
              class="w-full h-12 text-white border-none rounded text-[15px] font-medium cursor-pointer transition-all duration-200 active:scale-[0.98] hover:bg-[rgb(38,65,122)] active:bg-[rgb(28,50,97)]"
              style="background: rgb(48, 80, 147);"
            >
              Request New Reset Link
            </button>

            <button
              type="button"
              onclick={handleBackToLogin}
              class="w-full h-12 bg-transparent border border-[#e2e8f0] rounded text-[15px] font-medium cursor-pointer transition-all duration-200 text-[#4a5568] hover:bg-[#f7fafc]"
            >
              Back to Login
            </button>
          </div>
        </div>
      {:else if success}
        <!-- Success state -->
        <div class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>

          <h1 class="text-lg font-normal text-[#1a202c] mb-4">
            Password Reset Successfully!
          </h1>

          <p class="text-sm text-[#4a5568] mb-6">
            {success}
          </p>

          <p class="text-sm text-[#4a5568] mb-6">
            You will be redirected to the login page in a few seconds.
          </p>

          <button
            type="button"
            onclick={handleBackToLogin}
            class="w-full h-12 text-white border-none rounded text-[15px] font-medium cursor-pointer transition-all duration-200 active:scale-[0.98] hover:bg-[rgb(38,65,122)] active:bg-[rgb(28,50,97)]"
            style="background: rgb(48, 80, 147);"
          >
            Continue to Login
          </button>
        </div>
      {:else}
        <!-- Reset password form -->
        <h1 class="text-center text-lg font-normal text-[#1a202c] mb-4">
          Create New Password
        </h1>

        {#if email}
          <p class="text-center text-sm text-[#4a5568] mb-8">
            Creating new password for <strong>{email}</strong>
          </p>
        {/if}

        <!-- Form -->
        <form onsubmit={handleSubmit}>
          <!-- Error Message -->
          {#if error}
            <div class="mb-5 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          {/if}

          <!-- New Password Field with Floating Label -->
          <div class="relative mb-5">
            <input
              type="password"
              id="newPassword"
              placeholder=" "
              bind:value={newPassword}
              required
              disabled={isLoading}
              class="peer w-full h-12 px-4 border border-[#e2e8f0] rounded text-[15px] text-[#1a202c] transition-colors focus:outline-none focus:border-[rgb(109,140,248)] placeholder:text-transparent"
            />
            <label
              for="newPassword"
              class="absolute left-4 top-[14px] text-[#a0aec0] text-[15px] pointer-events-none transition-all duration-200 bg-white px-1
              peer-focus:top-[-8px] peer-focus:left-3 peer-focus:text-xs peer-focus:text-[rgb(109,140,248)]
              peer-[:not(:placeholder-shown)]:top-[-8px] peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-[rgb(109,140,248)]"
            >
              New Password *
            </label>
          </div>

          <!-- Confirm Password Field with Floating Label -->
          <div class="relative mb-5">
            <input
              type="password"
              id="confirmPassword"
              placeholder=" "
              bind:value={confirmPassword}
              required
              disabled={isLoading}
              class="peer w-full h-12 px-4 border border-[#e2e8f0] rounded text-[15px] text-[#1a202c] transition-colors focus:outline-none focus:border-[rgb(109,140,248)] placeholder:text-transparent"
            />
            <label
              for="confirmPassword"
              class="absolute left-4 top-[14px] text-[#a0aec0] text-[15px] pointer-events-none transition-all duration-200 bg-white px-1
              peer-focus:top-[-8px] peer-focus:left-3 peer-focus:text-xs peer-focus:text-[rgb(109,140,248)]
              peer-[:not(:placeholder-shown)]:top-[-8px] peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-[rgb(109,140,248)]"
            >
              Confirm Password *
            </label>
          </div>

          <!-- Password Requirements -->
          <div class="mb-5 text-xs text-[#4a5568]">
            Password must be at least 8 characters long
          </div>

          <!-- Reset Password Button -->
          <button
            type="submit"
            disabled={isLoading}
            class="w-full h-12 text-white border-none rounded text-[15px] font-medium cursor-pointer transition-all duration-200 mb-6 active:scale-[0.98] disabled:opacity-50 hover:bg-[rgb(38,65,122)] active:bg-[rgb(28,50,97)]"
            style="background: rgb(48, 80, 147);"
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      {/if}

      <!-- Footer Links -->
      {#if tokenValid !== false && !success}
        <div class="flex items-center justify-center">
          <button
            type="button"
            onclick={handleBackToLogin}
            class="text-sm transition-colors hover:text-[rgb(48,80,147)] bg-transparent border-none cursor-pointer"
            style="color: rgb(109, 140, 248);"
          >
            ← Back to Login
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }
</style>