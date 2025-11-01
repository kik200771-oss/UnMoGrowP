
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/about" | "/app-dashboard" | "/app" | "/app/overview" | "/dashboard-redis" | "/dashboard" | "/demo" | "/forgot-password" | "/login" | "/register" | "/reset-password" | "/sverdle" | "/sverdle/how-to-play";
		RouteParams(): {
			
		};
		LayoutParams(): {
			"/": Record<string, never>;
			"/about": Record<string, never>;
			"/app-dashboard": Record<string, never>;
			"/app": Record<string, never>;
			"/app/overview": Record<string, never>;
			"/dashboard-redis": Record<string, never>;
			"/dashboard": Record<string, never>;
			"/demo": Record<string, never>;
			"/forgot-password": Record<string, never>;
			"/login": Record<string, never>;
			"/register": Record<string, never>;
			"/reset-password": Record<string, never>;
			"/sverdle": Record<string, never>;
			"/sverdle/how-to-play": Record<string, never>
		};
		Pathname(): "/" | "/about" | "/about/" | "/app-dashboard" | "/app-dashboard/" | "/app" | "/app/" | "/app/overview" | "/app/overview/" | "/dashboard-redis" | "/dashboard-redis/" | "/dashboard" | "/dashboard/" | "/demo" | "/demo/" | "/forgot-password" | "/forgot-password/" | "/login" | "/login/" | "/register" | "/register/" | "/reset-password" | "/reset-password/" | "/sverdle" | "/sverdle/" | "/sverdle/how-to-play" | "/sverdle/how-to-play/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/favicon.svg" | "/robots.txt" | string & {};
	}
}