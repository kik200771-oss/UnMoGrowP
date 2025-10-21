<script lang="ts">
  import { api } from '$lib/api/client';

  // Svelte 5 Runes API - form state
  let email = $state('');
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  let success = $state<string | null>(null);
  let emailSent = $state(false);

  async function handleSubmit(e: Event) {
    e.preventDefault();

    // Reset states
    isLoading = true;
    error = null;
    success = null;

    try {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        error = 'Please enter a valid email address';
        return;
      }

      // Call forgot password API
      const response = await api.forgotPassword(email.trim());

      if (response.success) {
        emailSent = true;
        success = response.message || 'Password reset instructions have been sent to your email.';

        // Show reset token in console for testing (remove in production)
        if (response.data?.resetToken) {
          console.log('Reset token:', response.data.resetToken);
          console.log('Reset URL:', `http://localhost:5173/reset-password?token=${response.data.resetToken}`);
        }
      } else {
        error = response.error || 'Failed to send reset email. Please try again.';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'An unexpected error occurred';
    } finally {
      isLoading = false;
    }
  }

  function handleBackToLogin() {
    // Navigate back to login
    window.location.href = '/login';
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

    <!-- Forgot Password Card -->
    <div class="bg-white rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.15)] p-12">
      {#if !emailSent}
        <!-- Reset Request Form -->
        <h1 class="text-center text-lg font-normal text-[#1a202c] mb-4">
          Reset your password
        </h1>

        <p class="text-center text-sm text-[#4a5568] mb-8">
          Enter your email address and we'll send you instructions to reset your password.
        </p>

        <!-- Form -->
        <form onsubmit={handleSubmit}>
          <!-- Error Message -->
          {#if error}
            <div class="mb-5 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          {/if}

          <!-- Email Field with Floating Label -->
          <div class="relative mb-5">
            <input
              type="email"
              id="email"
              placeholder=" "
              bind:value={email}
              required
              disabled={isLoading}
              class="peer w-full h-12 px-4 border border-[#e2e8f0] rounded text-[15px] text-[#1a202c] transition-colors focus:outline-none focus:border-[rgb(109,140,248)] placeholder:text-transparent"
            />
            <label
              for="email"
              class="absolute left-4 top-[14px] text-[#a0aec0] text-[15px] pointer-events-none transition-all duration-200 bg-white px-1
              peer-focus:top-[-8px] peer-focus:left-3 peer-focus:text-xs peer-focus:text-[rgb(109,140,248)]
              peer-[:not(:placeholder-shown)]:top-[-8px] peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-[rgb(109,140,248)]"
            >
              Email Address *
            </label>
          </div>

          <!-- Send Reset Email Button -->
          <button
            type="submit"
            disabled={isLoading}
            class="w-full h-12 text-white border-none rounded text-[15px] font-medium cursor-pointer transition-all duration-200 mb-6 active:scale-[0.98] disabled:opacity-50 hover:bg-[rgb(38,65,122)] active:bg-[rgb(28,50,97)]"
            style="background: rgb(48, 80, 147);"
          >
            {isLoading ? 'Sending...' : 'Send Reset Email'}
          </button>
        </form>
      {:else}
        <!-- Success Message -->
        <div class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>

          <h1 class="text-lg font-normal text-[#1a202c] mb-4">
            Check your email
          </h1>

          {#if success}
            <p class="text-sm text-[#4a5568] mb-6">
              {success}
            </p>
          {/if}

          <p class="text-sm text-[#4a5568] mb-8">
            If you don't see the email, check your spam folder or try again with a different email address.
          </p>
        </div>
      {/if}

      <!-- Footer Links -->
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
    </div>
  </div>
</div>

<style>
  /* Additional Svelte-specific styles if needed */
</style>