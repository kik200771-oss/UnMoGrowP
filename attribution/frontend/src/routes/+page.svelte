<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    // Redirect to dashboard
    goto('/dashboard');
  });
</script>

<div class="flex h-screen items-center justify-center">
  <div class="text-center">
    <h1 class="text-4xl font-bold text-primary">UnMoGrowP Attribution</h1>
    <p class="mt-2 text-muted-foreground">Loading dashboard...</p>
    <div class="mt-8 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
  </div>
</div>
