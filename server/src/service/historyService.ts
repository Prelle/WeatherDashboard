import fs from 'node:fs/promises';
import { v4 as uuidv4 } from 'uuid';

const historyFile = 'db/searchHistory.json';

class City {
  name: string;
  id: string;

  constructor(name: string, id: string) {
    this.name = name;
    this.id = id;
  }
}

class HistoryService {
  // Reads from the searchHistory.json file
  private async read():Promise<any> {
    const result = await fs.readFile(historyFile);
    
    return result;    
  }

  // Writes an updated cities array to the searchHistory.json file
  private async write(cities: City[]) {
    await fs.writeFile(historyFile, JSON.stringify(cities));
  }

  // Reads the cities from the searchHistory.json file and returns them as an array of City objects
  async getCities():Promise<City[]> {
    const buffer = await this.read();

    const cities:City[] = JSON.parse(buffer);   

    return cities;
  }

  // Adds a city to the searchHistory.json file with a unique ID
  async addCity(cityName: string) {
    const cities:City[] = await this.getCities();

    // Ensure the city doesn't already exist in the history
    if (cities.find(city => city.name === cityName)) {
      return;
    }

    // Add the new city to the list with a unique ID
    cities.push(new City(cityName, uuidv4()));

    // Update the DB file
    this.write(cities);
  }
  
  // Removes a city from the searchHistory.json file
  async removeCity(id: string) {
    const cities:City[] = await this.getCities();

    // If the specified city exists, remove it from the array
    const existingCity = cities.findIndex(city => city.id === id);
    
    if (existingCity !== -1) {
      cities.splice(existingCity, 1);
    }

    // Update the DB file
    this.write(cities);
  }
}

export default new HistoryService();
