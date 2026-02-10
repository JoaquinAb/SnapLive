import { Suspense } from 'react';
import PaymentSuccessContent from './PaymentSuccessContent';

export const dynamic = 'force-dynamic';

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <PaymentSuccessContent />
        </Suspense>
    );
}
