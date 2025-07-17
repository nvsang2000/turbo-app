import { Button } from '@repo/ui/button';
import { Moon, Sun, CheckIcon, SunMoon } from 'lucide-react';
import { useAZApp } from './AZApp';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Ánh xạ chế độ theme với biểu tượng tương ứng
 * - light: Biểu tượng mặt trời (Sun)
 * - dark: Biểu tượng mặt trăng (Moon)
 * - system: Biểu tượng mặt trời và mặt trăng kết hợp (SunMoon)
 */
const ICONS = {
	light: Sun,
	dark: Moon,
	system: SunMoon,
};

/**
 * Component hiển thị một mục lựa chọn chế độ trong dropdown menu
 *
 * @param mode - Chế độ theme (light/dark/system)
 * @returns Phần tử dropdown menu có thể chọn để thay đổi chế độ theme
 */
const ToggleModeItem = memo(({ mode }: { mode: string }) => {
	const { setMode, mode: curMode } = useAZApp();
	const { t } = useTranslation();
	const Icon = ICONS[mode];

	console.log('ToggleModeItem', curMode, mode === curMode, mode);

	return (
		<DropdownMenuItem
			onClick={() => mode !== curMode && setMode(mode as any)}
			data-active={mode === curMode}
			className="group data-[active=true]:bg-primary/15 data-[active=true]:text-primary"
		>
			<Icon className="size-4 text-inherit" />
			<span>{t(`theme.${mode}`)}</span>
			{/* Hiển thị dấu check nếu đây là chế độ đang được chọn */}
			<CheckIcon className="invisible ml-auto size-4 text-inherit group-data-[active=true]:visible" />
		</DropdownMenuItem>
	);
});

/**
 * Component hiển thị một mục lựa chọn theme màu sắc trong dropdown menu
 *
 * @param name - Tên định danh của theme
 * @param theme - Đối tượng chứa thông tin về theme (tên hiển thị và mảng màu sắc)
 * @returns Phần tử dropdown menu có thể chọn để thay đổi theme màu sắc
 */
const ToggleThemeItem = memo(
	({
		name,
		theme,
	}: {
		name: string;
		theme: {
			name: string;
			colors: string[];
		};
	}) => {
		const { setTheme, theme: curTheme } = useAZApp();
		return (
			<DropdownMenuItem
				onClick={() => name !== curTheme && setTheme(name)}
				data-active={name === curTheme}
				className="group data-[active=true]:bg-primary/15 data-[active=true]:text-primary"
			>
				{/* Hiển thị xem trước màu sắc của theme */}
				<div className="flex gap-0.5">
					<div
						className="border-muted h-3 w-3 rounded-sm border"
						style={{ backgroundColor: theme.colors[0] }}
					/>
					<div
						className="border-muted h-3 w-3 rounded-sm border"
						style={{ backgroundColor: theme.colors[1] }}
					/>
					<div
						className="border-muted h-3 w-3 rounded-sm border"
						style={{ backgroundColor: theme.colors[2] }}
					/>
					<div
						className="border-muted h-3 w-3 rounded-sm border"
						style={{ backgroundColor: theme.colors[3] }}
					/>
				</div>
				<span>{theme.name}</span>
				{/* Hiển thị dấu check nếu đây là theme đang được chọn */}
				<CheckIcon className="invisible ml-auto size-4 text-inherit group-data-[active=true]:visible" />
			</DropdownMenuItem>
		);
	},
);

/**
 * Component nút chuyển đổi theme
 * Hiển thị dropdown menu cho phép người dùng:
 * - Chọn chế độ hiển thị (sáng/tối/theo hệ thống)
 * - Chọn bảng màu theme khác nhau
 *
 * @param props - Props cho component Button
 * @returns Nút chuyển đổi theme với dropdown menu
 */
export function ToggleTheme(props: React.ComponentProps<typeof Button>) {
	const { resolvedMode, themes } = useAZApp();
	const { t } = useTranslation('aria');

	/**
	 * Tạo danh sách các mục theme động dựa trên themes có sẵn
	 * Sử dụng useMemo để tránh tạo lại danh sách khi component render lại
	 */
	const menus = useMemo(() => {
		const menus: React.ReactNode[] = [];
		if (themes) {
			for (const key in themes) {
				menus.push(<ToggleThemeItem key={key} name={key} theme={themes[key]!} />);
			}
		}
		return menus;
	}, [themes]);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					{...props}
					aria-label={t('change-theme')}
					title={t('change-theme')}
				>
					{/* Hiển thị icon dựa trên chế độ hiện tại */}
					{resolvedMode === 'dark' ? (
						<Sun className="size-5 text-inherit transition-all" />
					) : (
						<Moon className="size-5 text-inherit transition-all" />
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="space-y-1">
				{/* Các tùy chọn chế độ theme */}
				<ToggleModeItem mode="light" />
				<ToggleModeItem mode="dark" />
				<ToggleModeItem mode="system" />
				{menus.length > 0 && <DropdownMenuSeparator />}
				{/* Danh sách các theme màu sắc */}
				{menus}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
