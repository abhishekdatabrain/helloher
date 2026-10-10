import mongoose, { Schema, Document } from "mongoose";

export interface IFootballRegistration extends Document {
    child: {
        name: string;
        dateOfBirth: Date;
        enteringGrade: string;
        weight: string;
        height: string;
        tShirtSize: string;
        jerseySize: string;
        address: {
            street: string;
            city: string;
            zipCode: string;
        };
    };
    parentGuardian: {
        name: string;
        homePhone: string;
        workCellPhone: string;
        email: string;
    };
    emergencyContacts: {
        name: string;
        relationship: string;
        phone: string;
    }[];
    hospitalAuthorization: {
        preferredDoctor: string;
        doctorPhone: string;
        preferredHospital: string;
    };
    insuranceInformation: {
        insuredParent: string;
        address: string;
        insuranceCompany: string;
        policyNumber: string;
        employerNameAddress: string;
    };
    costs: {
        varsityAndJV: number;
        cheerleading: number;
        flag: number;
        selectedOption: string;
    };
    consentAcknowledgement: {
        parentGuardianSignature: string;
        date: Date;
    };
    leagueInformation: {
        leagueWebsite: string;
        leagueEmail: string;
        preferredTeam: {
            varsity: boolean;
            jv: boolean;
            flag: boolean;
            cheerleading: boolean;
        };
        preferredCoach: string;
        draftOption: {
            sameTeam: boolean;
            enterIntoDraft: boolean;
        };
    };
    fundRaiser: {
        choice: string;
        amountPerBoxOrDonation: number;
        willSell: boolean;
        numberOfBoxes: number;
        initials: string;
    };
    internalUseOnly: {
        paid: boolean;
        notPaid: boolean;
        amountPaid: number;
        paymentMethod: string;
        myfRepInitials: string;
        combineNumber: string;
    };
}

const FootballRegistrationSchema: Schema = new Schema(
    {
        child: {
            name: { type: String, required: true },
            dateOfBirth: { type: Date, required: true },
            enteringGrade: { type: String },
            weight: { type: String },
            height: { type: String },
            tShirtSize: { type: String },
            jerseySize: { type: String },
            address: {
                street: { type: String },
                city: { type: String },
                zipCode: { type: String },
            },
        },
        parentGuardian: {
            name: { type: String, required: true },
            homePhone: { type: String },
            workCellPhone: { type: String },
            email: { type: String },
        },
        emergencyContacts: [
            {
                name: { type: String },
                relationship: { type: String },
                phone: { type: String },
            },
        ],
        hospitalAuthorization: {
            preferredDoctor: { type: String },
            doctorPhone: { type: String },
            preferredHospital: { type: String },
        },
        insuranceInformation: {
            insuredParent: { type: String },
            address: { type: String },
            insuranceCompany: { type: String },
            policyNumber: { type: String },
            employerNameAddress: { type: String },
        },
        costs: {
            varsityAndJV: { type: Number, default: 100 },
            cheerleading: { type: Number, default: 65 },
            flag: { type: Number, default: 35 },
            selectedOption: { type: String },
        },
        consentAcknowledgement: {
            parentGuardianSignature: { type: String },
            date: { type: Date },
        },
        leagueInformation: {
            leagueWebsite: { type: String, default: "www.midviewyouthfootball.net" },
            leagueEmail: { type: String, default: "myf@midviewyouthfootball.net" },
            preferredTeam: {
                varsity: { type: Boolean, default: false },
                jv: { type: Boolean, default: false },
                flag: { type: Boolean, default: false },
                cheerleading: { type: Boolean, default: false },
            },
            preferredCoach: { type: String },
            draftOption: {
                sameTeam: { type: Boolean, default: false },
                enterIntoDraft: { type: Boolean, default: false },
            },
        },
        fundRaiser: {
            choice: { type: String },
            amountPerBoxOrDonation: { type: Number, default: 25 },
            willSell: { type: Boolean, default: true },
            numberOfBoxes: { type: Number, default: 0 },
            initials: { type: String },
        },
        internalUseOnly: {
            paid: { type: Boolean, default: false },
            notPaid: { type: Boolean, default: false },
            amountPaid: { type: Number, default: 0 },
            paymentMethod: { type: String, enum: ["Cash", "Check", "Other"] },
            myfRepInitials: { type: String },
            combineNumber: { type: String },
        },
    },
    { timestamps: true }
);

export default mongoose.model<IFootballRegistration>(
    "FootballRegistration",
    FootballRegistrationSchema
);
