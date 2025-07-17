import {
	type ColumnDef,
	type ColumnFiltersState,
	type RowData,
	type SortingState,
	type VisibilityState,
	type TableOptions,
	type Table,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import {
	Table as TableEl,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@repo/ui/table';
import { useState } from 'react';
import { faker } from '@faker-js/faker';

declare module '@tanstack/react-table' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface ColumnMeta<TData extends RowData, TValue> {
		className: string;
	}
}

const EMPTY_DATA = [];
const TEST_DATA = Array.from({ length: 20 }, () => {
	const firstName = faker.person.firstName();
	const lastName = faker.person.lastName();
	return {
		id: faker.string.uuid(),
		firstName,
		lastName,
		username: faker.internet
			.username({ firstName, lastName })
			.toLocaleLowerCase(),
		email: faker.internet.email({ firstName }).toLocaleLowerCase(),
		phoneNumber: faker.phone.number({ style: 'international' }),
		status: faker.helpers.arrayElement([
			'active',
			'inactive',
			'invited',
			'suspended',
		]),
		role: faker.helpers.arrayElement([
			'superadmin',
			'admin',
			'cashier',
			'manager',
		]),
		createdAt: faker.date.past(),
		updatedAt: faker.date.recent(),
	};
});

export function useDataTable<TData extends RowData>(
	options: Omit<TableOptions<TData>, 'data' | 'columns' | 'getCoreRowModel'> & {
		// Tên bảng
		name: string;

		columns: ColumnDef<TData, any>[];

		data: TData[] | string | ((table: Table<TData>) => Promise<TData[]>);

		// Bật tắt phân trang
		pagination?: boolean;

		staleTime?: number;
	} = {
		name: 'data-table',
		columns: [],
		data: EMPTY_DATA,
		pagination: true,
	},
) {
	const [paging, setPaging] = useState({
		pageIndex: 0,
		pageSize: 10,
	});
	const [rowSelection, setRowSelection] = useState({});
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [sorting, setSorting] = useState<SortingState>([]);

	const { name, pagination, data: dataOption, staleTime } = options;
	const { isLoading, isError, data, error } = useQuery({
		queryKey: [name],
		queryFn: () => {
			// fetch(`/api/users?page=${paging.pageIndex}&limit=${paging.pageSize}`).then(
			// 	(res) => res.json(),
			// );
			console.log('queryFn');
			return TEST_DATA;
		},
		staleTime: staleTime ?? 0,
	});

	const table = useReactTable({
		enableRowSelection: true,
		manualPagination: true,
		manualSorting: true,
		manualFiltering: true,
		manualExpanding: true,
		manualGrouping: true,

		...options,
		data: (data ?? []) as TData[],
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
		},

		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,

		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
	});

	console.log('table');

	const columns = table.getAllColumns();

	return [
		<div className="space-y-4">
			<div className="mb-2 flex flex-wrap items-center justify-between space-y-2">
				<div>
					<h2 className="text-2xl font-bold tracking-tight">User List</h2>
					<p className="text-muted-foreground">
						Manage your users and their roles here.
					</p>
				</div>
				{/* <UsersPrimaryButtons /> */}
			</div>
			{/* <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12">
				<UsersTable data={userList} columns={columns} />
			</div> */}

			{/* <DataTableToolbar table={table} /> */}
			<div className="rounded-md border">
				<TableEl>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id} className="group/row">
								{headerGroup.headers.map((header) => {
									return (
										<TableHead
											key={header.id}
											colSpan={header.colSpan}
											className={header.column.columnDef.meta?.className ?? ''}
										>
											{header.isPlaceholder
												? null
												: flexRender(header.column.columnDef.header, header.getContext())}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && 'selected'}
									className="group/row"
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											className={cell.column.columnDef.meta?.className ?? ''}
										>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={columns.length} className="h-24 text-center">
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</TableEl>
			</div>
			{/* <DataTablePagination table={table} /> */}
		</div>,
		table,
	];
}
