import { SignUp } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
      <SignUp routing='hash' forceRedirectUrl="/sign-up/success"/>
    </div>
  );
}
