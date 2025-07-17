import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
	type JSX,
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { ThemeProvider, useTheme } from 'next-themes';
import { useFunc } from '@repo/ui/hooks/useFunc';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

const CACHE = new Map<string, Promise<any>>();
i18n.use(initReactI18next).use({
	type: 'backend',
	init: () => {},
	read: async (language: string, namespace: string, callback: any) => {
		if (process.env.NODE_ENV === 'production') {
			let f = CACHE.get(language);
			if (!f) {
				CACHE.set(
					language,
					(f = fetch(
						`/locales/${language}.json?${import.meta.env.VITE_APP_VERSION}`,
					).then(async (res) => {
						if (res.status === 404) return {};
						try {
							return await res.json();
						} catch {
							return {};
						}
					})),
				);
			}
			callback(null, (await f)[namespace] || {});
		} else {
			callback(
				null,
				await fetch(
					`/locales/${language}/${namespace}.json?${import.meta.env.VITE_APP_VERSION}`,
				).then(async (res) => {
					if (res.status === 404) return {};
					try {
						return await res.json();
					} catch {
						return {};
					}
				}),
			);
		}
	},
});

const queryClient = new QueryClient();

const AZAppProviderContext = createContext<{
	readonly theme: string;
	readonly language: string;
	readonly mode: 'light' | 'dark' | 'system';
	readonly resolvedMode: 'light' | 'dark';
	readonly themes: { [key: string]: { name: string; colors: string[] } };
	readonly languages: { code: string; label: string }[];
	setMode: (mode: 'light' | 'dark' | 'system') => void;
	setTheme: (theme: string) => void;
	setLanguage: (lang: string) => void;
}>(null as any);

function AZAppProviderWrapper({
	themes,
	languages,
	children,
}: {
	themes: { [key: string]: { name: string; colors: string[] } };
	languages: { code: string; label: string }[];
	children: JSX.Element;
}) {
	const [change, setChange] = useState({});
	const { i18n } = useTranslation();
	const {
		setTheme: setMode,
		theme: mode,
		resolvedTheme: resolvedMode,
	} = useTheme();

	const theme: string = useMemo(() => {
		let theme = localStorage.getItem('theme-az');
		if (!themes[theme!]) {
			for (const key in themes) {
				theme = key;
				break;
			}
		}
		return theme!;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [themes, change]);

	useEffect(() => {
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = `/themes/${theme}.css`;
		document.head.appendChild(link);
		document.documentElement.setAttribute('data-theme', theme);
		return () => {
			link.remove();
		};
	}, [theme]);

	const setTheme = useFunc((theme: string) => {
		if (themes[theme]) {
			localStorage.setItem('theme-az', theme);
			setChange({});
		}
	});

	const setLanguage = useFunc((code: string) => {
		if (i18n.language !== code && languages.find((lang) => lang.code === code)) {
			localStorage.setItem('language', code);
			i18n.changeLanguage(code);
		}
	});

	const context = useMemo(() => {
		return {
			theme,
			language: i18n.language,
			mode,
			resolvedMode,
			themes,
			languages,
			setTheme,
			setLanguage,
			setMode,
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [themes, languages, theme, mode, resolvedMode, setMode, i18n.language]);

	return (
		<AZAppProviderContext.Provider value={context as any}>
			{children}
		</AZAppProviderContext.Provider>
	);
}

export function AZAppProvider({
	themes,
	languages,
	children,
}: {
	themes: { [key: string]: { name: string; colors: string[] } };
	languages: { code: string; label: string }[];
	children: JSX.Element;
}) {
	if (!i18n.isInitialized) {
		i18n.init({
			lng: localStorage.getItem('language') || languages[0]!.code, // mặc định
			fallbackLng: languages[0]!.code,
			defaultNS: 'common',
			ns: [],
			partialBundledLanguages: true,
			initImmediate: true,
		});
	}

	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<AZAppProviderWrapper themes={themes} languages={languages}>
				<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
			</AZAppProviderWrapper>
		</ThemeProvider>
	);
}

export function useAZApp() {
	return useContext(AZAppProviderContext);
}
