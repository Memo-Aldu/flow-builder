import { Logo } from '@/components/Logo';
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <Logo/>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
        <SignIn routing='hash' forceRedirectUrl="/sign-in/success"/>
      </div>
    </div>
  );
}
