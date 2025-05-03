"use client"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { createCheckoutSession } from '@/lib/api/purchases'
import { CreditsPackages, PackageType } from '@/types/billing'
import { useAuth } from '@clerk/nextjs'
import { useMutation } from '@tanstack/react-query'
import { CoinsIcon, CreditCard } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'
import { toast } from 'sonner'

const CreditsPurchase = () => {
  const { getToken } = useAuth()
    const router = useRouter()
  const [selectedPackage, setSelectedPackage] = React.useState(CreditsPackages[1].id)

  const mutation = useMutation( {
    mutationFn: async (id: PackageType) => {
        const token  = await getToken();
        if (!token) {
            throw new Error("User not authenticated");
        }
        const session = await createCheckoutSession(token, id);
        if (!session) {
            throw new Error("Failed to create checkout session");
        }
        router.push(session.url);
    },
    onSuccess: () => {
        toast.success("Credits purchased successfully", { id: "purchase-credits" });
    },
    onError: (error) => {
        toast.error("Failed to purchase credits", { id: "purchase-credits" });
        console.error(error)
    }
  })
  return (
    <Card>
        <CardHeader>
            <CardTitle className='text-2xl font-bold flex items-center gap-2'>
                <CoinsIcon className='h-6 w-6 text-primary'/>
                Purchase Credits
                </CardTitle>
                <CardDescription className='text-muted-foreground'>
                    Choose a package to purchase credits for your account. You can use these credits to run workflows.
                </CardDescription>
        </CardHeader>
        <CardContent>
            <RadioGroup onValueChange={value => setSelectedPackage(value as PackageType)} defaultValue={CreditsPackages[1].id}>
                {CreditsPackages.map((pkg) => (
                    <div key={pkg.id} className="flex items-center space-x-3 bg-secondary/50
                    rounded-lg p-3 hover:bg-secondary transition-all duration-200 mb-2"
                    onClick={() => setSelectedPackage(pkg.id)}>
                        <RadioGroupItem id={pkg.id} value={pkg.id}/>
                        <Label className='flex justify-between w-full cursor-pointer' htmlFor={pkg.id}>
                            <span className='font-medium'>{pkg.name} - {pkg.label}</span>
                            <span className='font-bold text-primary'>$ {(pkg.price / 100).toFixed(2)}</span>
                        </Label>
                    </div>
                ))}
            </RadioGroup>
        </CardContent>
        <CardFooter>
            <Button className='w-full' disabled={mutation.isPending}
            onClick={() => {mutation.mutate(selectedPackage)}}>
                <CreditCard className='mr-2 h-5 w-5'/> Purchase Credits
            </Button>
        </CardFooter>
    </Card>
  )
}

export default CreditsPurchase