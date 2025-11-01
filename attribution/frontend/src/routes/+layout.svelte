<script lang="ts">
  import '../app.css';
  import { ModeWatcher } from 'mode-watcher';
  import { Toaster } from 'svelte-sonner';

  let { children } = $props();
</script>

<ModeWatcher />
<Toaster richColors position="top-right" />

<div class="min-h-screen bg-background">
  {@render children()}
</div>
