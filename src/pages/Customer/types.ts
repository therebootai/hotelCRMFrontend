export interface CustomerProfile {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  loyaltyTier?: string;
  companyName?: string;
  companyGST?: string;
  preferences?:
    | string[]
    | {
        smokingRoom?: boolean;
        highFloor?: boolean;
        nearLift?: boolean;
        bedType?: string;
        notes?: string;
      };
  internalNotes?: string;
  createdAt: string;
}

export interface CustomerDetail extends CustomerProfile {
  history?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bookings: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    checkins: any[];
  };
}

export interface CustomerFormPayload {
  name: string;
  phone: string;
  email: string;
  address: string;
  companyName: string;
  companyGST: string;
  loyaltyTier: string;
  preferences: string[];
  internalNotes: string;
}
