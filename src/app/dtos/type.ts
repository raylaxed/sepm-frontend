export enum Type {
  CINEMA = 'Cinema',
  SPORTS = 'Sports Match',
  THEATRE = 'Theatre',
  CONCERT = 'Concert',
  COMEDY = 'Comedy Show',
  MUSICAL = 'Musical',
  FESTIVAL = 'Festival',
  EXHIBITION = 'Exhibition',
  CONFERENCE = 'Conference',
  WORKSHOP = 'Workshop'
}

// Modified to correctly get array of values
export const Types: string[] = Object.values(Type).filter(value => typeof value === 'string');
