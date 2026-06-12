export interface StaffMember {
 _id: string;
 fullName: string;
 email: string;
 role: "admin" | "receptionist";
 isActive: boolean;
 mobile: string;
 loginId: string;
 createdAt?: string;
}

export interface StaffFormPayload {
 fullName: string;
 mobile: string;
 role: string;
 loginId: string;
 password: string;
 isActive: boolean;
}
