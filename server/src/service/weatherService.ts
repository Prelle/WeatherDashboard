import dotenv from 'dotenv';
dotenv.config();

interface Coordinates {
  lat: number;
  lon: number;
}

class Weather {
  city: string;
  date: string;
  icon: string;
  iconDescription: string;
  tempF: number;
  windSpeed: number;
  humidity: number;  

  constructor(city:string, unixTime:number, icon:string, iconDescription:string, tempF:number, windSpeed:number, humidity:number) {
    this.city = city;    
    this.icon = icon;
    this.iconDescription = iconDescription;
    this.tempF = tempF;
    this.windSpeed = windSpeed;
    this.humidity = humidity;

    // Convert the unix timestamp to a friendly date string
    const jsDate = new Date(unixTime * 1000);    
    this.date = `${jsDate.getMonth()+1}/${jsDate.getDate()}/${jsDate.getFullYear()}`;
  }  
}

class WeatherService {  
  private baseUrl?: string;
  private apiKey?: string;  

  constructor() {
    this.baseUrl = process.env.API_BASE_URL || '';
    this.apiKey = process.env.API_KEY || '';    
  }

  // Gets location data for a city using the geocoding API
  private async fetchLocationData(query: string):Promise<any> {
    try {
      const url = `${this.baseUrl}/geo/1.0/direct?${query}`;
     
      const response = await fetch(url);

      return await response.json();
    } catch (err) {      
      throw `Error Fetching Location Data:` + err;
    }
  }

  // converts location data returned from the geocoding API into Coordinates
  private destructureLocationData(locationData:any): Coordinates {  
    try {
      const result:Coordinates = {
        lat: locationData[0].lat,
        lon: locationData[0].lon
      };

      return result;
    } catch (err) {
      throw `Error Destructuring Location Data:` + err;      
    }   
  }

  // Determines the query string for the geocoding API
  private buildGeocodeQuery(cityName:string): string {
    return `q=${cityName}&limit=1&appid=${this.apiKey}`;
  }

  // Determines the query string for the current weather and 5-day forecast API endpoints
  private buildWeatherQuery(coordinates: Coordinates): string {
    return `lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${this.apiKey}`;
  }

  // Fetches and converts coordinate data
  private async fetchAndDestructureLocationData(cityName:string): Promise<Coordinates> {   
    const query = this.buildGeocodeQuery(cityName);    
    
    const data = await this.fetchLocationData(query);

    return this.destructureLocationData(data);
  }

  // Get data using the current weather API
  private async fetchWeatherData(coordinates: Coordinates):Promise<any> {
    const query = this.buildWeatherQuery(coordinates);
    const url = `${this.baseUrl}/data/2.5/weather?${query}`;

    try {
      const response = await fetch(url);

      return await response.json();
    } catch (err) {
      throw `Error Fetching Weather Data:` + err;
    }
  }

  // Get data using the 5-day forecast API
  private async fetchForecastData(coordinates: Coordinates):Promise<any> {
    const query = this.buildWeatherQuery(coordinates);
    const url = `${this.baseUrl}/data/2.5/forecast?${query}`;

    try {
      const response = await fetch(url);

      return await response.json();
    } catch (err) {
      throw `Error Fetching Forecast Data:` + err;
    }
  }
  
  // Parses OpenWeather's API results in a Weather entry
  private parseWeather(cityName:string, data:any):Weather {
    const result = new Weather(
      cityName,
      data.dt,
      data.weather[0].icon,
      data.weather[0].description,
      data.main.temp,
      data.wind.speed,
      data.main.humidity
    );

    return result;
  }

  // Converts the current weather response into a Weather object
  private parseCurrentWeather(response: any):Weather {
    try {
      const cityName = response.name;

      return this.parseWeather(cityName, response);
    } catch (err) {
      throw `Error parsing current weather:` + err;
    }
  }

  // Constructs the forecast array using current weather as the first entry
  // Expects weatherData to contain a 5-day forecast at 3-hour increments (40 records total)
  private buildForecastArray(currentWeather: Weather, weatherData: any[]):Weather[] {
    const result:Weather[] = [ currentWeather ];

    try {
      // Starting at the 4th record with step of 8 returns one record per day at Noon
      for (let i = 4; i < weatherData.length; i += 8) {
        result.push(this.parseWeather(currentWeather.city, weatherData[i]));
      }
      
      return result;
    } catch (err) {
      throw `Error building forecast array:` + err;
    }
  }

  // Takes a city name, converts it to coordinates and returns current weather + 5-day forecast for the location
  async getWeatherForCity(city: string) {
    try {
      // Convert the city name to coordinates
      const coords:Coordinates = await this.fetchAndDestructureLocationData(city);
      
      // Use the coordinates to fetch current weather data
      const current = await this.fetchWeatherData(coords);
      const currentWeather = this.parseCurrentWeather(current);

      // Use the coordinates to fetch 5-day forecast data
      const data = await this.fetchForecastData(coords);
      const result = this.buildForecastArray(currentWeather, data.list);      

      return result;
    } catch (err) {
      console.log(err);
      return err;
    }
  }
}

export default new WeatherService();
