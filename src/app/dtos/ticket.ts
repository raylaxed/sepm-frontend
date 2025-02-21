export interface Ticket {
  id?: number;
  showId?: number;
  standingSectorId?: number;
  seatId?: number;
  price: number;
  reserved: boolean;
  date: Date | string;
  purchased: boolean;
  inCart: boolean;
  userId?: number;
  orderId?: number;
  ticketType: string;
  show?: any;
  seat?: {
    id?: number;
    seatRow?: number;
    columnSeat?: number;
  };
}
