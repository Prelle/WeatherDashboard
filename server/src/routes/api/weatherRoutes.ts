import { Router } from 'express';
const router = Router();

import HistoryService from '../../service/historyService.js';
import WeatherService from '../../service/weatherService.js';

// Returns weather data for a specified city, and adds the city to the search history if not already present
router.post('/', async (req, res) => {
  // Get weather data for the requested city
  const city = req.body.cityName;

  const result = await WeatherService.getWeatherForCity(city);
  
  // Add the city to the search history
  const resArray = result as Array<any>;
  
  if (resArray instanceof Array) {
    HistoryService.addCity(resArray[0].city);

    res.json(result);
  } else {
    res.status(500).json(result);
  }  
});

// Retrieves the search history
router.get('/history', async (_, res) => {
  res.json(await HistoryService.getCities());
});

// Deletes a city for the search history
router.delete('/history/:id', async (req, res) => {
  HistoryService.removeCity(req.params.id);

  res.json('City deleted successfully');
});

export default router;
