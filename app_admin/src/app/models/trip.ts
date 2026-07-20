export interface Trip {
  _id?: string;
  code: string;
  name: string;
  length: string;
  start: string | Date;
  resort: string;
  perPerson: string | number;
  image: string;
  description: string;
}
