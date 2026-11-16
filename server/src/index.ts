import dotenv from 'dotenv';
import { createApp } from './app';
import { createDrizzleRepositories } from './repositories/drizzleRepository';

dotenv.config({ path: '../.env' });

const PORT = Number(process.env.PORT) || 4000;
const repos = createDrizzleRepositories();
const app = createApp(repos);

app.listen(PORT, () => {
  console.log(`GrowLocal API running on http://localhost:${PORT}`);
});
