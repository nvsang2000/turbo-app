import { Button } from '@repo/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu';
import { CheckIcon, Globe } from 'lucide-react';
import { memo, useMemo } from 'react';
import { useAZApp } from './AZApp';
import { useTranslation } from 'react-i18next';

/**
 * Component hiển thị một mục ngôn ngữ trong dropdown menu
 * @param lang - Đối tượng chứa mã và nhãn của ngôn ngữ
 */
const ToggleLanguageItem = memo(
	({
		lang: { code, label },
	}: {
		lang: {
			code: string;
			label: string;
		};
	}) => {
		const { language, setLanguage } = useAZApp();

		return (
			<DropdownMenuItem
				onClick={() => setLanguage(code)}
				data-active={code === language}
				className="group data-[active=true]:bg-primary/15 data-[active=true]:text-primary"
			>
				<span className="ps-2">{label}</span>
				<CheckIcon className="invisible ml-auto size-4 text-inherit group-data-[active=true]:visible" />
			</DropdownMenuItem>
		);
	},
);

/**
 * Component cho phép người dùng chuyển đổi giữa các ngôn ngữ khác nhau
 */
export function LanguageSwitcher(props: React.ComponentProps<typeof Button>) {
	const { languages } = useAZApp();
	const { t } = useTranslation('aria');

	// Tạo danh sách các mục ngôn ngữ từ danh sách ngôn ngữ
	const items = useMemo(
		() =>
			languages?.map((lang) => <ToggleLanguageItem key={lang.code} lang={lang} />),
		[languages],
	);

	// Kiểm tra xem có ít nhất 2 ngôn ngữ không
	// Nếu không có, không hiển thị dropdown
	// Nếu có, hiển thị dropdown
	if (languages.length < 2) return null;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					{...props}
					aria-label={t('change-language')}
					title={t('change-language')} // Thêm thuộc tính title
				>
					<Globe className="size-5 text-inherit" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="space-y-1">
				{items}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
