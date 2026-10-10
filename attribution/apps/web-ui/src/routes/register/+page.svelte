<!--
  Registration Page for UnMoGrowP Attribution Platform

  Features:
  - User registration with name, email, password
  - Password confirmation validation
  - Input validation
  - Error handling
  - Automatic login after registration
  - Responsive design matching login page
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { auth, authState } from '$lib/stores/auth';
  import { api } from '$lib/api/client';
  import { generateUserFriendlyPassword, generateMemorablePassword, checkPasswordStrength } from '$lib/utils/password';

  // Form state using Svelte 5 runes
  let name = $state('');
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');

  // Validation state
  let nameError = $state('');
  let emailError = $state('');
  let passwordError = $state('');
  let confirmPasswordError = $state('');

  // Email availability checking state
  let emailChecking = $state(false);
  let emailAvailable = $state<boolean | null>(null);
  let emailCheckTimeout: number | null = null;

  // Password generation state
  let passwordVisible = $state(false);
  let confirmPasswordVisible = $state(false);
  let generatedPassword = $state('');
  let passwordStrength = $state({ score: 0, level: 'Very Weak' as const, feedback: [] });
  let showPasswordStrength = $state(false);

  // Subscribe to auth state from store using Svelte 5 runes
  let isAuthenticated = $derived($authState.isAuthenticated);
  let isLoading = $derived($authState.isLoading);
  let error = $derived($authState.error);

  // Redirect if already authenticated
  onMount(() => {
    if (isAuthenticated) {
      goto('/dashboard');
    }
  });

  // Redirect on successful registration/login using effect
  $effect(() => {
    if (isAuthenticated) {
      goto('/dashboard');
    }
  });

  // Form validation
  function validateName(): boolean {
    nameError = '';
    if (!name.trim()) {
      nameError = 'Name is required';
      return false;
    }
    if (name.trim().length < 2) {
      nameError = 'Name must be at least 2 characters';
      return false;
    }
    return true;
  }

  function validateEmail(): boolean {
    emailError = '';
    if (!email.trim()) {
      emailError = 'Email is required';
      emailAvailable = null;
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      emailError = 'Please enter a valid email address';
      emailAvailable = null;
      return false;
    }
    return true;
  }

  // Check email availability with debouncing
  async function checkEmailAvailability() {
    if (!validateEmail()) return;

    // Clear previous timeout
    if (emailCheckTimeout) {
      clearTimeout(emailCheckTimeout);
    }

    // Debounce API call (wait 500ms after user stops typing)
    emailCheckTimeout = setTimeout(async () => {
      emailChecking = true;
      emailAvailable = null;

      try {
        const response = await api.checkEmailAvailability(email.trim());

        if (response.success && response.data) {
          emailAvailable = response.data.available;

          if (!response.data.available) {
            emailError = response.data.message || 'Email is already taken';
            // Очищаем поля пароля, так как регистрация невозможна
            password = '';
            confirmPassword = '';
            passwordError = '';
            confirmPasswordError = '';
          } else {
            emailError = ''; // Clear any existing error
          }
        } else {
          emailError = response.error || 'Failed to check email availability';
          emailAvailable = null;
        }
      } catch (error) {
        console.error('Email check error:', error);
        emailError = 'Failed to check email availability';
        emailAvailable = null;
      } finally {
        emailChecking = false;
      }
    }, 500);
  }

  // Reset email availability when email changes
  function onEmailInput() {
    emailAvailable = null;
    emailError = '';
    checkEmailAvailability();
  }

  function validatePassword(): boolean {
    passwordError = '';
    if (!password) {
      passwordError = 'Password is required';
      return false;
    }
    if (password.length < 6) {
      passwordError = 'Password must be at least 6 characters';
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      passwordError = 'Password must contain at least one lowercase letter, one uppercase letter, and one digit';
      return false;
    }
    return true;
  }

  function validateConfirmPassword(): boolean {
    confirmPasswordError = '';
    if (!confirmPassword) {
      confirmPasswordError = 'Please confirm your password';
      return false;
    }
    if (password !== confirmPassword) {
      confirmPasswordError = 'Passwords do not match';
      return false;
    }
    return true;
  }

  function validateForm(): boolean {
    const isNameValid = validateName();
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();

    // Check if email is available (must be explicitly checked)
    if (emailAvailable === false) {
      emailError = 'Email is already taken';
      return false;
    }

    return isNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid && emailAvailable !== false;
  }

  // Handle form submission
  async function handleSubmit(e: Event) {
    e.preventDefault();

    if (!validateForm()) return;

    // Use the auth store for registration (which auto-logs in on success)
    const success = await auth.register(email.trim(), password, name.trim());

    if (!success) {
      console.error('Registration failed - check auth store error state');
    }
  }

  // Handle enter key
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleSubmit(event);
    }
  }

  // Password generation functions
  function generateSecurePassword() {
    const newPassword = generateUserFriendlyPassword(12);
    password = newPassword;
    confirmPassword = newPassword;
    generatedPassword = newPassword;

    // Update password strength
    updatePasswordStrength();

    // Clear any existing password errors
    passwordError = '';
    confirmPasswordError = '';

    // Show password temporarily
    passwordVisible = true;
    confirmPasswordVisible = true;
    setTimeout(() => {
      passwordVisible = false;
      confirmPasswordVisible = false;
    }, 3000);
  }

  function generateMemorablePasswordFunc() {
    const newPassword = generateMemorablePassword();
    password = newPassword;
    confirmPassword = newPassword;
    generatedPassword = newPassword;

    // Update password strength
    updatePasswordStrength();

    // Clear any existing password errors
    passwordError = '';
    confirmPasswordError = '';

    // Show password temporarily
    passwordVisible = true;
    confirmPasswordVisible = true;
    setTimeout(() => {
      passwordVisible = false;
      confirmPasswordVisible = false;
    }, 3000);
  }

  function updatePasswordStrength() {
    if (password.length > 0) {
      passwordStrength = checkPasswordStrength(password);
      showPasswordStrength = true;
    } else {
      showPasswordStrength = false;
    }
  }

  function togglePasswordVisibility() {
    passwordVisible = !passwordVisible;
  }

  function toggleConfirmPasswordVisibility() {
    confirmPasswordVisible = !confirmPasswordVisible;
  }

  // Update password strength when password changes
  $effect(() => {
    updatePasswordStrength();
  });
</script>

<svelte:head>
  <title>Register - UnMoGrowP Attribution Platform</title>
  <meta name="description" content="Create your UnMoGrowP account to start tracking attribution analytics" />
</svelte:head>

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

    <!-- Registration Card -->
    <div class="bg-white rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.15)] p-12">
      <h1 class="text-center text-lg font-normal text-[#1a202c] mb-8">
        Create your account
      </h1>

      <!-- Form -->
      <form onsubmit={handleSubmit}>
        <!-- Error Message -->
        {#if error}
          <div class="mb-5 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {error}
          </div>
        {/if}

        <!-- Name Field with Floating Label -->
        <div class="relative mb-5">
          <input
            type="text"
            id="name"
            placeholder=" "
            bind:value={name}
            onblur={validateName}
            onkeydown={handleKeyDown}
            required
            disabled={isLoading}
            class="peer w-full h-12 px-4 border border-[#e2e8f0] rounded text-[15px] text-[#1a202c] transition-colors focus:outline-none focus:border-[rgb(109,140,248)] placeholder:text-transparent"
            class:border-red-300={nameError}
            class:focus:border-red-500={nameError}
          />
          <label
            for="name"
            class="absolute left-4 top-[14px] text-[#a0aec0] text-[15px] pointer-events-none transition-all duration-200 bg-white px-1
            peer-focus:top-[-8px] peer-focus:left-3 peer-focus:text-xs peer-focus:text-[rgb(109,140,248)]
            peer-[:not(:placeholder-shown)]:top-[-8px] peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-[rgb(109,140,248)]"
            class:text-red-500={nameError}
          >
            Full Name *
          </label>
          {#if nameError}
            <p class="text-xs text-red-600 mt-1">{nameError}</p>
          {/if}
        </div>

        <!-- Email Field with Floating Label -->
        <div class="relative mb-5">
          <input
            type="email"
            id="email"
            placeholder=" "
            bind:value={email}
            oninput={onEmailInput}
            onblur={validateEmail}
            onkeydown={handleKeyDown}
            required
            disabled={isLoading}
            class="peer w-full h-12 px-4 pr-12 border border-[#e2e8f0] rounded text-[15px] text-[#1a202c] transition-colors focus:outline-none focus:border-[rgb(109,140,248)] placeholder:text-transparent"
            class:border-red-300={emailError}
            class:focus:border-red-500={emailError}
            class:border-green-300={emailAvailable === true}
            class:focus:border-green-500={emailAvailable === true}
          />
          <label
            for="email"
            class="absolute left-4 top-[14px] text-[#a0aec0] text-[15px] pointer-events-none transition-all duration-200 bg-white px-1
            peer-focus:top-[-8px] peer-focus:left-3 peer-focus:text-xs peer-focus:text-[rgb(109,140,248)]
            peer-[:not(:placeholder-shown)]:top-[-8px] peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-[rgb(109,140,248)]"
            class:text-red-500={emailError}
            class:text-green-500={emailAvailable === true}
          >
            Email Address *
          </label>

          <!-- Email status indicator -->
          <div class="absolute right-3 top-[14px]">
            {#if emailChecking}
              <!-- Loading spinner -->
              <div class="w-5 h-5 border-2 border-gray-300 border-t-[rgb(109,140,248)] rounded-full animate-spin"></div>
            {:else if emailAvailable === true}
              <!-- Available checkmark -->
              <svg class="w-5 h-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            {:else if emailAvailable === false}
              <!-- Not available X mark -->
              <svg class="w-5 h-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            {/if}
          </div>

          {#if emailError}
            <p class="text-xs text-red-600 mt-1">{emailError}</p>
          {:else if emailAvailable === true}
            <p class="text-xs text-green-600 mt-1">✓ Email is available for registration</p>
          {/if}
        </div>

        <!-- Password Field with Floating Label -->
        <div class="relative mb-5">
          <input
            type={passwordVisible ? 'text' : 'password'}
            id="password"
            placeholder=" "
            bind:value={password}
            onblur={validatePassword}
            onkeydown={handleKeyDown}
            required
            disabled={isLoading}
            class="peer w-full h-12 px-4 pr-24 border border-[#e2e8f0] rounded text-[15px] text-[#1a202c] transition-colors focus:outline-none focus:border-[rgb(109,140,248)] placeholder:text-transparent"
            class:border-red-300={passwordError}
            class:focus:border-red-500={passwordError}
          />
          <label
            for="password"
            class="absolute left-4 top-[14px] text-[#a0aec0] text-[15px] pointer-events-none transition-all duration-200 bg-white px-1
            peer-focus:top-[-8px] peer-focus:left-3 peer-focus:text-xs peer-focus:text-[rgb(109,140,248)]
            peer-[:not(:placeholder-shown)]:top-[-8px] peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-[rgb(109,140,248)]"
            class:text-red-500={passwordError}
          >
            Password *
          </label>
          <!-- Password visibility toggle -->
          <button
            type="button"
            onclick={togglePasswordVisibility}
            class="absolute right-2 top-[14px] text-[#a0aec0] hover:text-[rgb(109,140,248)] transition-colors"
            disabled={isLoading}
          >
            {#if passwordVisible}
              <!-- Eye slash icon -->
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.88 9.88L4.87 4.87C3.69 6.01 2.75 7.5 2.25 9.18C3.53 13.73 7.48 17 12 17C13.57 17 15.05 16.68 16.38 16.1L14.12 13.84C13.5 14.1 12.78 14.21 12 14.21C9.76 14.21 7.9 12.52 7.26 10.35C7.61 10.1 8.18 9.88 9.88 9.88Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M21.75 9.18C20.47 4.63 16.52 1.36 12 1.36C10.43 1.36 8.95 1.68 7.62 2.26L9.88 4.52C10.5 4.26 11.22 4.15 12 4.15C14.24 4.15 16.1 5.84 16.74 8.01C16.39 8.26 15.82 8.48 14.12 8.48L21.75 9.18Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3 3L21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            {:else}
              <!-- Eye icon -->
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4.5C7.48 4.5 3.53 7.77 2.25 12.32C3.53 16.87 7.48 20.14 12 20.14C16.52 20.14 20.47 16.87 21.75 12.32C20.47 7.77 16.52 4.5 12 4.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            {/if}
          </button>

          <!-- Password strength indicator -->
          {#if showPasswordStrength}
            <div class="mt-2">
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="text-[#4a5568]">Password Strength:</span>
                <span class="font-medium" class:text-red-500={passwordStrength.score < 30} class:text-orange-500={passwordStrength.score >= 30 && passwordStrength.score < 60} class:text-green-500={passwordStrength.score >= 60}>
                  {passwordStrength.level}
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="h-2 rounded-full transition-all duration-300"
                  style="width: {passwordStrength.score}%"
                  class:bg-red-500={passwordStrength.score < 30}
                  class:bg-orange-500={passwordStrength.score >= 30 && passwordStrength.score < 60}
                  class:bg-green-500={passwordStrength.score >= 60}
                ></div>
              </div>
            </div>
          {/if}

          {#if passwordError}
            <p class="text-xs text-red-600 mt-1">{passwordError}</p>
          {/if}
        </div>

        <!-- Password Generation Buttons -->
        <div class="mb-5">
          {#if emailAvailable !== false}
            <p class="text-xs text-[#4a5568] mb-2">Or generate a secure password:</p>
            <div class="flex gap-2">
              <button
                type="button"
                onclick={generateSecurePassword}
                disabled={isLoading || emailAvailable === false}
                class="px-3 py-2 text-xs bg-[rgb(109,140,248)] text-white rounded hover:bg-[rgb(99,130,238)] transition-colors disabled:opacity-50"
              >
                🔐 Secure Password
              </button>
              <button
                type="button"
                onclick={generateMemorablePasswordFunc}
                disabled={isLoading || emailAvailable === false}
                class="px-3 py-2 text-xs bg-[rgb(79,70,229)] text-white rounded hover:bg-[rgb(67,56,202)] transition-colors disabled:opacity-50"
              >
                🧠 Memorable Password
              </button>
            </div>
          {:else}
            <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p class="text-sm text-blue-800 mb-2">
                <strong>This email is already registered.</strong>
              </p>
              <p class="text-xs text-blue-600 mb-3">
                If this is your account, please sign in or reset your password.
              </p>
              <div class="flex gap-2">
                <a
                  href={`/login?email=${encodeURIComponent(email.trim())}`}
                  class="px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  🔑 Sign In
                </a>
                <button
                  type="button"
                  class="px-3 py-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  onclick={() => alert('Password reset feature will be added in the next version')}
                >
                  🔄 Forgot Password
                </button>
              </div>
            </div>
          {/if}
        </div>

        <!-- Confirm Password Field with Floating Label -->
        <div class="relative mb-5">
          <input
            type={confirmPasswordVisible ? 'text' : 'password'}
            id="confirmPassword"
            placeholder=" "
            bind:value={confirmPassword}
            onblur={validateConfirmPassword}
            onkeydown={handleKeyDown}
            required
            disabled={isLoading}
            class="peer w-full h-12 px-4 pr-12 border border-[#e2e8f0] rounded text-[15px] text-[#1a202c] transition-colors focus:outline-none focus:border-[rgb(109,140,248)] placeholder:text-transparent"
            class:border-red-300={confirmPasswordError}
            class:focus:border-red-500={confirmPasswordError}
          />
          <label
            for="confirmPassword"
            class="absolute left-4 top-[14px] text-[#a0aec0] text-[15px] pointer-events-none transition-all duration-200 bg-white px-1
            peer-focus:top-[-8px] peer-focus:left-3 peer-focus:text-xs peer-focus:text-[rgb(109,140,248)]
            peer-[:not(:placeholder-shown)]:top-[-8px] peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-[rgb(109,140,248)]"
            class:text-red-500={confirmPasswordError}
          >
            Confirm Password *
          </label>
          <!-- Password visibility toggle -->
          <button
            type="button"
            onclick={toggleConfirmPasswordVisibility}
            class="absolute right-2 top-[14px] text-[#a0aec0] hover:text-[rgb(109,140,248)] transition-colors"
            disabled={isLoading}
          >
            {#if confirmPasswordVisible}
              <!-- Eye slash icon -->
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.88 9.88L4.87 4.87C3.69 6.01 2.75 7.5 2.25 9.18C3.53 13.73 7.48 17 12 17C13.57 17 15.05 16.68 16.38 16.1L14.12 13.84C13.5 14.1 12.78 14.21 12 14.21C9.76 14.21 7.9 12.52 7.26 10.35C7.61 10.1 8.18 9.88 9.88 9.88Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M21.75 9.18C20.47 4.63 16.52 1.36 12 1.36C10.43 1.36 8.95 1.68 7.62 2.26L9.88 4.52C10.5 4.26 11.22 4.15 12 4.15C14.24 4.15 16.1 5.84 16.74 8.01C16.39 8.26 15.82 8.48 14.12 8.48L21.75 9.18Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3 3L21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            {:else}
              <!-- Eye icon -->
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4.5C7.48 4.5 3.53 7.77 2.25 12.32C3.53 16.87 7.48 20.14 12 20.14C16.52 20.14 20.47 16.87 21.75 12.32C20.47 7.77 16.52 4.5 12 4.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            {/if}
          </button>
          {#if confirmPasswordError}
            <p class="text-xs text-red-600 mt-1">{confirmPasswordError}</p>
          {/if}
        </div>

        <!-- Terms and Privacy -->
        <div class="mb-5">
          <p class="text-xs text-[#4a5568]">
            By creating an account, you agree to our
            <a href="/terms" class="text-[rgb(109,140,248)] hover:underline">Terms of Service</a>
            and
            <a href="/privacy" class="text-[rgb(109,140,248)] hover:underline">Privacy Policy</a>
          </p>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          disabled={isLoading || emailAvailable === false}
          class="w-full h-12 text-white border-none rounded text-[15px] font-medium cursor-pointer transition-all duration-200 mb-6 active:scale-[0.98] disabled:opacity-50 hover:bg-[rgb(38,65,122)] active:bg-[rgb(28,50,97)]"
          style="background: rgb(48, 80, 147);"
        >
          {#if emailAvailable === false}
            Email Already Registered
          {:else if isLoading}
            Creating Account...
          {:else}
            Create Account
          {/if}
        </button>
      </form>

      <!-- Footer Links -->
      <div class="text-center">
        <p class="text-sm text-[#4a5568]">
          Already have an account?
          <a
            href="/login"
            class="text-sm transition-colors hover:text-[rgb(48,80,147)] ml-1"
            style="color: rgb(109, 140, 248);"
          >
            Sign In
          </a>
        </p>
      </div>
    </div>
  </div>
</div>

<style>
  /* Custom styles for better UX */
  input:disabled {
    background-color: #f9fafb;
    cursor: not-allowed;
  }

  button:disabled {
    cursor: not-allowed;
  }
</style>