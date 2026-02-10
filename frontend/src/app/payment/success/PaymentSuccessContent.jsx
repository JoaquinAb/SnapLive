'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PaymentSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Wait a brief moment to show the success message then redirect
        const timer = setTimeout(() => {
            router.replace('/dashboard/events/new?payment=success');
        }, 2000);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
            <h1>¡Pago Exitoso!</h1>
            <p className="text-muted">Procesando tu pago, aguardá un instante...</p>
            <div className="spinner" style={{ marginTop: '2rem' }}></div>
        </div>
    );
}
