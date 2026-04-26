import authRoutes from './routes/auth.js';

console.log(JSON.stringify(authRoutes.stack.map(m => ({ path: m.route?.path, methods: m.route?.methods })), null, 2));
