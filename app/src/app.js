require('dotenv').config();

const express = require('express');

const flightRoutes = require('./routes/flightRoutes');

const Flight = require('./models/Flight');

const app = express();

const PORT = process.env.PORT;

// Middleware
app.use(express.json());
app.use('/', flightRoutes);
app.use(express.urlencoded({ extended: false }));


async function syncDatabase() {
  try {
    await Flight.sync({ force: false });
    console.log('Modelo sincronizado con la base de datos');
  } catch (error) {
    console.error('Error al sincronizar el modelo con la base de datos:', error);
  }
}

syncDatabase();

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor Express corriendo en http://localhost:${PORT}`);
});
