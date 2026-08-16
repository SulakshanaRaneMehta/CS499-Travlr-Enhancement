export interface Trip {
  _id?: string;
  code: string;
  name: string;
  length: string;
  nights: number;
  start: string | Date;
  resort: string;
  perPerson: number;
  image: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}
