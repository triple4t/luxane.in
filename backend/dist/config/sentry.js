import * as Sentry from '@sentry/node';
import dotenv from 'dotenv';
dotenv.config();
export const initSentry = () => {
    if (process.env.SENTRY_DSN) {
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || 'development',
            tracesSampleRate: 1.0, // Capture 100% of transactions
            profilesSampleRate: 1.0, // Capture 100% of profiles
        });
        console.log('✅ Sentry initialized');
    }
    else {
        console.log('⚠️  Sentry DSN not found, skipping Sentry initialization');
    }
};
export default Sentry;
