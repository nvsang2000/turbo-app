import type { EventMessage } from '@repo/lib/event';

export default interface CategoryCreated extends EventMessage {
	data: {
		orderId: string;
		customerId: string;
		totalAmount: number;
		items: Array<{ id: string; quantity: number }>;
		createdAt: Date;
	};
}
