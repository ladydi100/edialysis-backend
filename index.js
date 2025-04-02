const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const userRoutes = require('./src/routes/userRoutes');
const medicationRoutes = require('./src/routes/medicationRoutes');
const healthRoutes = require('./src/routes/healthRoutes');
const dialysisRoutes = require('./src/routes/dialysisRoutes');

const app = express();

// Middlewares
//app.use(cors());
app.use(cors({
  origin: '*', // O restringe a la IP de tu app móvil
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

// Rutas
app.use('/api', userRoutes);
app.use('/api', medicationRoutes);
app.use('/api', healthRoutes);
app.use('/api', dialysisRoutes);

// Iniciar el servidor
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

app.use((req, res, next) => {
  console.log(`Solicitud recibida: ${req.method} ${req.url}`); // Log para verificar las solicitudes
  next();
});