export enum PackageType {
    SMALL = "SMALL",
    MEDIUM = "MEDIUM",
    LARGE = "LARGE",
}

export type CreditsPackage = {
    id: PackageType;
    name: string;
    label: string;
    credits: number;
    price: number;
}

export const CreditsPackages: CreditsPackage[] = [
    {
        id: PackageType.SMALL,
        name: "Small Package",
        label: "1000 Credits",
        credits: 1000,
        price: 299, // $2.99
    },
    {
        id: PackageType.MEDIUM,
        name: "Medium",
        label: "5000 Credits",
        credits: 5000,
        price: 899, // $8.99
    },
    {
        id: PackageType.LARGE,
        name: "Large",
        label: "10000 Credits",
        credits: 10000,
        price: 1299,  // $12.00
    },
]

export const getCreditsPackageById = (id: PackageType): CreditsPackage | undefined => {
    return CreditsPackages.find((pkg) => pkg.id === id);
}