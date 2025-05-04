const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const userRoutes = require('./src/routes/userRoutes');
const medicationRoutes = require('./src/routes/medicationRoutes');
const healthRoutes = require('./src/routes/healthRoutes');
const dialysisRoutes = require('./src/routes/dialysisRoutes');
const medicalAppointmentRoutes = require('./src/routes/medicalAppointmentRoutes');
//const morgan = require('morgan'); // <-- Añade log en caso de un error persistente

const app = express();

// Configuración avanzada de logging
/*
app.use(morgan('dev')); // Logs concisos de las peticiones HTTP
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', {
  stream: {
    write: (message) => console.log(`[HTTP] ${message.trim()}`)
  }
}));
*/

// Middlewares
app.use(cors({
  origin: '*', // O restringe a la IP de tu app móvil
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());



// Middleware personalizado para log de body en peticiones PUT/POST
/*app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  
  console.log('Headers:', {
    authorization: req.headers.authorization,
    'content-type': req.headers['content-type']
  });
  
  next();
});
*/



// Rutas
app.use('/api', userRoutes);
app.use('/api', medicationRoutes);
app.use('/api', healthRoutes);
app.use('/api', dialysisRoutes);
app.use('/api', medicalAppointmentRoutes);

// Iniciar el servidor
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

app.use((req, res, next) => {
  console.log(`Solicitud recibida: ${req.method} ${req.url}`); // Log para verificar las solicitudes
 console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  next();
});