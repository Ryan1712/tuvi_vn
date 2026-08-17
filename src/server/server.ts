import { app } from './app.js';

const PORT = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000;

app.listen(PORT, () => {
  console.log(`tuvi-chart-engine API listening on port ${PORT}`);
});
