export interface HallDto {
  id?: number;
  name: string;
  capacity: number;
  canvasWidth: number;
  canvasHeight: number;
  stage: Stage | null;
  sectors: SectorDto[];
  standingSectors: StandingSector[];
}

export interface SectorDto {
  id?: number;
  sectorName: number;
  rows: number;
  columns: number;
  price: number;
  customName?: string;
  seats: SeatDto[];
}

interface StandingSector {
  id?: number;
  sectorName: number;
  capacity: number;
  takenCapacity: number;
  positionX1: number;
  positionY1: number;
  positionX2: number;
  positionY2: number;
  price: number;
}

export interface SeatDto {
  seatId: number;
  sector: number;
  rowSeat: number;
  columnSeat: number;
  positionX: number;
  positionY: number;
  isAvailable: boolean;
}

export interface Stage {
  positionX: number;
  positionY: number;
  width: number;
  height: number;
}
