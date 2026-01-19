export interface Donation {
  name: string,
  adress: string,
  email: string,
  ico: string,
  birthdate: string,
  note: string,
  is_anonymous: boolean,
  for_company: boolean,
  not_public: boolean,
  variable_symbol: string,
  price?: {
    id: string;
    selector: string,
    title: string,
    value: number,
  }
}
