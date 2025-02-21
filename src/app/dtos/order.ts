import { Ticket } from './ticket';

export interface Order {
    id?: number;
    total: number;
    orderDate: Date;
    tickets: Ticket[];
    userId: number;
    paymentIntentId: string;
    cancelled: boolean;
    cancellationInvoiceId?: number;
}
