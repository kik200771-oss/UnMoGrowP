<script lang="ts">
  // Svelte 5 Runes API - эквивалент useState из React
  let email = $state('');
  let password = $state('');
  let rememberMe = $state(false);
  let isLoading = $state(false);
  let recaptchaToken = $state<string | null>(null);
  let recaptchaRef: any;

  async function handleSubmit(e: Event) {
    e.preventDefault();

    if (!recaptchaToken) {
      alert('Пожалуйста, подтвердите что вы не робот');
      return;
    }

    isLoading = true;

    // TODO: Implement actual email/password login logic
    console.log('Login attempt:', { email, password, rememberMe, recaptchaToken });

    setTimeout(() => {
      isLoading = false;
      if (recaptchaRef) {
        recaptchaRef.reset();
      }
      recaptchaToken = null;
    }, 1000);
  }

  async function handleGoogleLogin() {
    if (!recaptchaToken) {
      alert('Пожалуйста, подтвердите что вы не робот');
      return;
    }

    isLoading = true;
    try {
      // TODO: Implement Auth.js signIn with Google
      console.log('Google login attempt');
      // await signIn('google', { callbackUrl: '/dashboard' });
    } catch (error) {
      console.error('Google login error:', error);
      isLoading = false;
    }
  }

  function onRecaptchaChange(token: string | null) {
    recaptchaToken = token;
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

    <!-- Login Card -->
    <div class="bg-white rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.15)] p-12">
      <h1 class="text-center text-lg font-normal text-[#1a202c] mb-8">
        Login to your account
      </h1>

      <!-- Form -->
      <form onsubmit={handleSubmit}>
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

        <!-- Password Field with Floating Label -->
        <div class="relative mb-5">
          <input
            type="password"
            id="password"
            placeholder=" "
            bind:value={password}
            required
            disabled={isLoading}
            class="peer w-full h-12 px-4 border border-[#e2e8f0] rounded text-[15px] text-[#1a202c] transition-colors focus:outline-none focus:border-[rgb(109,140,248)] placeholder:text-transparent"
          />
          <label
            for="password"
            class="absolute left-4 top-[14px] text-[#a0aec0] text-[15px] pointer-events-none transition-all duration-200 bg-white px-1
            peer-focus:top-[-8px] peer-focus:left-3 peer-focus:text-xs peer-focus:text-[rgb(109,140,248)]
            peer-[:not(:placeholder-shown)]:top-[-8px] peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-[rgb(109,140,248)]"
          >
            Password *
          </label>
        </div>

        <!-- Remember Me -->
        <div class="flex items-center mb-5">
          <input
            type="checkbox"
            id="remember"
            bind:checked={rememberMe}
            class="w-4 h-4 mr-2 cursor-pointer"
          />
          <label for="remember" class="text-sm text-[#4a5568] cursor-pointer select-none">
            Remember me
          </label>
        </div>

        <!-- Sign In Button -->
        <button
          type="submit"
          disabled={isLoading}
          class="w-full h-12 text-white border-none rounded text-[15px] font-medium cursor-pointer transition-all duration-200 mb-4 active:scale-[0.98] disabled:opacity-50 hover:bg-[rgb(38,65,122)] active:bg-[rgb(28,50,97)]"
          style="background: rgb(48, 80, 147);"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <!-- Google Login Button -->
      <button
        type="button"
        onclick={handleGoogleLogin}
        disabled={isLoading || !recaptchaToken}
        class="w-full h-12 bg-white border border-[#e2e8f0] rounded text-sm text-[#4a5568] cursor-pointer transition-colors flex items-center justify-center gap-3 mb-6 hover:bg-[#f7fafc] disabled:opacity-50"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span>Вход через аккаунт Google</span>
      </button>

      <!-- Google reCAPTCHA Placeholder -->
      <div class="flex justify-center mb-6">
        <div class="text-sm text-gray-500">
          [reCAPTCHA будет здесь]
        </div>
      </div>

      <!-- Footer Links -->
      <div class="flex items-center justify-between">
        <a
          href="#"
          class="text-sm transition-colors hover:text-[rgb(48,80,147)]"
          style="color: rgb(109, 140, 248);"
        >
          Forgot password?
        </a>
        <a
          href="#"
          class="text-sm transition-colors hover:text-[rgb(48,80,147)]"
          style="color: rgb(109, 140, 248);"
        >
          Don't have an account? Sign Up
        </a>
      </div>
    </div>
  </div>
</div>

<style>
  /* Additional Svelte-specific styles if needed */
</style>
