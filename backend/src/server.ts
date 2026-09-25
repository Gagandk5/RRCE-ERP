import app from './express-app';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 RRCE ERP MERN Express Backend running at http://localhost:${PORT}/api`);
});
