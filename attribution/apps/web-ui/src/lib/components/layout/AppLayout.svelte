<!--
  Main App Layout - UnMoGrowP Attribution Platform

  AppsFlyer-inspired navigation structure with custom UnMoGrowP design

  Navigation Structure:
  - Overview (Dashboard)
  - Cohorts (User retention analysis)
  - Raw Data (Event-level data)
  - Pivot (Custom reports)
  - ROI360 (Campaign profitability)
  - Partners (Ad network integrations)
  - Configuration (Settings)
-->

<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { auth, authState } from '$lib/stores/auth';

  // Props
  interface Props {
    children: any;
  }
  let { children }: Props = $props();

  // Auth state
  const authStateValue = $derived($authState);
  const user = $derived(authStateValue.user);
  const isAuthenticated = $derived(authStateValue.isAuthenticated);

  // Current app selection (in real app this would be from user's apps)
  let selectedApp = $state({
    id: 'com.company.awesomegame',
    name: 'My Awesome Game',
    platform: 'iOS & Android',
    icon: '🎮'
  });

  // Navigation items - AppsFlyer inspired structure
  let navigationItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: '📊',
      path: '/app/overview',
      description: 'Key metrics and performance summary'
    },
    {
      id: 'cohorts',
      label: 'Cohorts',
      icon: '👥',
      path: '/app/cohorts',
      description: 'User retention and engagement analysis'
    },
    {
      id: 'raw-data',
      label: 'Raw Data',
      icon: '🔍',
      path: '/app/raw-data',
      description: 'Event-level data and detailed logs'
    },
    {
      id: 'pivot',
      label: 'Pivot',
      icon: '📈',
      path: '/app/pivot',
      description: 'Custom reports and data analysis'
    },
    {
      id: 'roi360',
      label: 'ROI360',
      icon: '💰',
      path: '/app/roi360',
      description: 'Campaign profitability and ROAS analysis'
    },
    {
      id: 'partners',
      label: 'Partners',
      icon: '🤝',
      path: '/app/partners',
      description: 'Ad network integrations and management'
    },
    {
      id: 'configuration',
      label: 'Configuration',
      icon: '⚙️',
      path: '/app/configuration',
      description: 'App settings and integration setup'
    }
  ];

  // Get current page
  const currentPath = $derived($page.url.pathname);
  const currentNavItem = $derived(
    navigationItems.find(item => currentPath.startsWith(item.path)) || navigationItems[0]
  );

  // Sidebar state
  let sidebarOpen = $state(true);
  let showAppSelector = $state(false);

  // Mock user apps (in real app this comes from API)
  let userApps = $state([
    { id: 'com.company.awesomegame', name: 'My Awesome Game', icon: '🎮', platform: 'iOS & Android' },
    { id: 'com.company.puzzlegame', name: 'Puzzle Master', icon: '🧩', platform: 'iOS' },
    { id: 'com.company.racegame', name: 'Speed Racer', icon: '🏎️', platform: 'Android' }
  ]);

  async function handleLogout() {
    await auth.logout();
    goto('/login');
  }

  function selectApp(app: any) {
    selectedApp = app;
    showAppSelector = false;
    // In real app, this would trigger data reload for selected app
  }

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }
</script>

<div class="app-layout" class:sidebar-open={sidebarOpen}>
  <!-- Top Header -->
  <header class="app-header">
    <div class="header-left">
      <!-- Sidebar toggle -->
      <button class="sidebar-toggle" onclick={toggleSidebar}>
        <span class="hamburger"></span>
      </button>

      <!-- App selector -->
      <div class="app-selector" class:open={showAppSelector}>
        <button class="app-selector-btn" onclick={() => showAppSelector = !showAppSelector}>
          <span class="app-icon">{selectedApp.icon}</span>
          <div class="app-info">
            <span class="app-name">{selectedApp.name}</span>
            <span class="app-platform">{selectedApp.platform}</span>
          </div>
          <span class="dropdown-arrow">▼</span>
        </button>

        {#if showAppSelector}
          <div class="app-dropdown">
            {#each userApps as app}
              <button
                class="app-option"
                class:selected={app.id === selectedApp.id}
                onclick={() => selectApp(app)}
              >
                <span class="app-icon">{app.icon}</span>
                <div class="app-info">
                  <span class="app-name">{app.name}</span>
                  <span class="app-platform">{app.platform}</span>
                </div>
              </button>
            {/each}

            <div class="app-dropdown-footer">
              <button class="add-app-btn">+ Add New App</button>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <div class="header-right">
      <!-- User menu -->
      <div class="user-menu">
        <span class="user-name">{user?.name || 'User'}</span>
        <button class="user-avatar" onclick={handleLogout}>
          👤
        </button>
      </div>
    </div>
  </header>

  <!-- Sidebar Navigation -->
  <aside class="app-sidebar" class:open={sidebarOpen}>
    <nav class="sidebar-nav">
      {#each navigationItems as item}
        <a
          href={item.path}
          class="nav-item"
          class:active={currentNavItem?.id === item.id}
          title={item.description}
        >
          <span class="nav-icon">{item.icon}</span>
          <span class="nav-label">{item.label}</span>
        </a>
      {/each}
    </nav>

    <!-- Sidebar Footer -->
    <div class="sidebar-footer">
      <div class="brand">
        <span class="brand-icon">🚀</span>
        <span class="brand-name">UnMoGrowP</span>
      </div>
    </div>
  </aside>

  <!-- Main Content Area -->
  <main class="app-main" class:sidebar-open={sidebarOpen}>
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <span class="breadcrumb-icon">{currentNavItem?.icon}</span>
      <span class="breadcrumb-text">{currentNavItem?.label}</span>
    </div>

    <!-- Page Content -->
    <div class="page-content">
      {@render children()}
    </div>
  </main>
</div>

<style>
  .app-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #f8fafc;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  }

  /* Header Styles */
  .app-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 60px;
    background: white;
    border-bottom: 1px solid #e2e8f0;
    padding: 0 1.5rem;
    position: relative;
    z-index: 1000;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .sidebar-toggle {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }

  .hamburger {
    width: 18px;
    height: 2px;
    background: #4a5568;
    position: relative;
    transition: all 0.3s;
  }

  .hamburger::before,
  .hamburger::after {
    content: '';
    position: absolute;
    width: 18px;
    height: 2px;
    background: #4a5568;
    transition: all 0.3s;
  }

  .hamburger::before {
    top: -6px;
  }

  .hamburger::after {
    bottom: -6px;
  }

  /* App Selector */
  .app-selector {
    position: relative;
  }

  .app-selector-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    background: #f7fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .app-selector-btn:hover {
    background: #edf2f7;
    border-color: #cbd5e0;
  }

  .app-icon {
    font-size: 1.25rem;
  }

  .app-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .app-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: #2d3748;
  }

  .app-platform {
    font-size: 0.75rem;
    color: #718096;
  }

  .dropdown-arrow {
    font-size: 0.75rem;
    color: #a0aec0;
    transition: transform 0.2s;
  }

  .app-selector.open .dropdown-arrow {
    transform: rotate(180deg);
  }

  .app-dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    z-index: 1001;
    overflow: hidden;
  }

  .app-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1rem;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    transition: background 0.2s;
  }

  .app-option:hover {
    background: #f7fafc;
  }

  .app-option.selected {
    background: #ebf8ff;
    color: #2b6cb0;
  }

  .app-dropdown-footer {
    border-top: 1px solid #e2e8f0;
    padding: 0.5rem;
  }

  .add-app-btn {
    width: 100%;
    padding: 0.5rem;
    background: #4299e1;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: background 0.2s;
  }

  .add-app-btn:hover {
    background: #3182ce;
  }

  /* User Menu */
  .user-menu {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .user-name {
    font-size: 0.9rem;
    color: #4a5568;
    font-weight: 500;
  }

  .user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    color: white;
    font-size: 1rem;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .user-avatar:hover {
    transform: scale(1.05);
  }

  /* Sidebar */
  .app-sidebar {
    position: fixed;
    left: 0;
    top: 60px;
    width: 240px;
    height: calc(100vh - 60px);
    background: white;
    border-right: 1px solid #e2e8f0;
    transform: translateX(-100%);
    transition: transform 0.3s;
    z-index: 999;
    display: flex;
    flex-direction: column;
  }

  .app-sidebar.open {
    transform: translateX(0);
  }

  .sidebar-nav {
    flex: 1;
    padding: 1rem 0;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.5rem;
    color: #4a5568;
    text-decoration: none;
    transition: all 0.2s;
    border-right: 3px solid transparent;
  }

  .nav-item:hover {
    background: #f7fafc;
    color: #2d3748;
  }

  .nav-item.active {
    background: #ebf8ff;
    color: #2b6cb0;
    border-right-color: #4299e1;
    font-weight: 600;
  }

  .nav-icon {
    font-size: 1.1rem;
    width: 20px;
    text-align: center;
  }

  .nav-label {
    font-size: 0.9rem;
  }

  .sidebar-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #e2e8f0;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .brand-icon {
    font-size: 1.25rem;
  }

  .brand-name {
    font-weight: 700;
    color: #2d3748;
    font-size: 1rem;
  }

  /* Main Content */
  .app-main {
    flex: 1;
    margin-left: 0;
    padding-top: 60px;
    transition: margin-left 0.3s;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .app-main.sidebar-open {
    margin-left: 240px;
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 2rem;
    background: white;
    border-bottom: 1px solid #e2e8f0;
  }

  .breadcrumb-icon {
    font-size: 1.1rem;
  }

  .breadcrumb-text {
    font-size: 1.1rem;
    font-weight: 600;
    color: #2d3748;
  }

  .page-content {
    flex: 1;
    padding: 2rem;
    overflow-y: auto;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .app-main.sidebar-open {
      margin-left: 0;
    }

    .app-sidebar {
      width: 280px;
    }

    .page-content {
      padding: 1rem;
    }

    .breadcrumb {
      padding: 1rem;
    }
  }

  /* Click overlay for mobile sidebar */
  @media (max-width: 768px) {
    .app-layout.sidebar-open::after {
      content: '';
      position: fixed;
      top: 60px;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 998;
    }
  }
</style>