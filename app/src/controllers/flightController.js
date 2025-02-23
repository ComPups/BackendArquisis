const Flight = require('../models/Flight');
const { Op } = require('sequelize');

class FlightController {
  static async createFlight(req, res) {
    try {
      // Obtener los datos del cuerpo de la solicitud MQTT
      const mqttData = req.body;
  
      // Extraer la información de los vuelos y otros datos
      const { flights, carbonEmission, price, currency, airlineLogo } = mqttData[0];
  
      // Convertir la cadena JSON de vuelos en un objeto JavaScript
      const parsedFlights = JSON.parse(flights);
  
      // Crear un documento de vuelo en la base de datos para cada vuelo
      const flightPromises = parsedFlights.map(async (flight) => {
        await Flight.create({
          departure_airport_name: flight.departure_airport.name,
          departure_airport_id: flight.departure_airport.id,
          departure_airport_time: new Date(flight.departure_airport.time),
          arrival_airport_name: flight.arrival_airport.name,
          arrival_airport_id: flight.arrival_airport.id,
          arrival_airport_time: new Date(flight.arrival_airport.time),
          duration: flight.duration,
          airplane: flight.airplane,
          airline: flight.airline,
          airline_logo: flight.airline_logo,
          carbon_emissions: JSON.parse(carbonEmission).this_flight || null,
          price: price,
          currency: currency,
          airlineLogo: airlineLogo
        });
      });
  
      // Esperar a que todas las promesas de creación de vuelos se resuelvan
      try {
        await Promise.all(flightPromises);
        console.log('Vuelos creados exitosamente');
      } catch (error) {
        console.error('Error al esperar las promesas:', error);
        // Manejar el error según sea necesario
      }
  
      // Enviar una respuesta de éxito
      res.status(201).json({ message: 'Vuelos creados exitosamente' });
    } catch (error) {
      console.error('Error al crear vuelo desde MQTT:', error);
      // Enviar una respuesta de error
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async getFlightById(req, res) {
    const { id } = req.params;
    try {
      const flight = await Flight.findByPk(id);
      if (!flight) {
        return res.status(404).json({ error: 'Vuelo no encontrado' });
      }
      res.json(flight);
    } catch (error) {
      console.error('Error al obtener el vuelo de la base de datos:', error);
      res.status(500).json({ error: 'Error al obtener el vuelo de la base de datos' });
    }
  }

  static async getFlights(req, res) {
    try {
      // Obtener parámetros de consulta del URL
      let { departure, arrival, date, page, count } = req.query;

      // Convertir la fecha a formato de fecha de JavaScript
      const departureDate = new Date(date);

      // Establecer valores predeterminados para la paginación
      page = parseInt(page, 10) || 1; // Página predeterminada: 1
      count = parseInt(count, 10) || 25; // Cantidad predeterminada por página: 25

      // Calcular el desplazamiento en función de la página y la cantidad por página
      const offset = (page - 1) * count;

      // Configurar las condiciones de búsqueda
      const whereCondition = {};

      // Agregar condiciones de búsqueda si se proporcionan parámetros de consulta
      if (departure && arrival && date) {
        whereCondition.departure_airport_id = departure;
        whereCondition.arrival_airport_id = arrival;
        whereCondition.departure_airport_time = {
          [Op.gte]: departureDate, // Búsqueda de vuelos después o en la fecha especificada
        };
      }

      // Buscar vuelos en la base de datos con paginación
      const flights = await Flight.findAndCountAll({
        where: whereCondition,
        limit: count, // Cantidad de vuelos por página
        offset: offset // Desplazamiento para paginación
      });

      // Enviar vuelos encontrados como respuesta junto con información de paginación
      res.status(200).json({
        flights: flights.rows,
        totalCount: flights.count,
        totalPages: Math.ceil(flights.count / count), // Total de páginas
        currentPage: page // Página actual
      });
    } catch (error) {
      console.error('Error al buscar vuelos:', error);
      // Enviar una respuesta de error si ocurre algún problema
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

module.exports = FlightController;

