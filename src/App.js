import React, { useState, useCallback } from 'react';
import './App.css';
import debounce from 'lodash.debounce';

const App = () => {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const fetchSuggestions = useCallback(
    debounce(async (value) => {
      if (!value.trim()) return setSuggestions([]);

      try {
        const res = await fetch(
          `http://api.openweathermap.org/geo/1.0/direct?q=${value}&limit=5&appid=${process.env.REACT_APP_WEATHER_API_KEY}`
        );
        if (!res.ok) throw new Error('Failed to fetch suggestions');
        const data = await res.json();
        setSuggestions(data.map((item) => ({
          name: item.name,
          country: item.country,
          state: item.state || '',
          lat: item.lat,
          lon: item.lon,
        })));
      } catch {
        setSuggestions([]);
      }
    }, 300),
    []
  );

  const fetchWeather = async (cityName, lat, lon) => {
    if (!cityName.trim()) {
      setError('Please enter a city name');
      setWeather(null);
      return;
    }

    setLoading(true);
    try {
      const query = lat && lon ? `lat=${lat}&lon=${lon}` : `q=${cityName}`;
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?${query}&appid=${process.env.REACT_APP_WEATHER_API_KEY}&units=metric`
      );
      if (!res.ok) throw new Error('City not found');
      const data = await res.json();
      setWeather(data);
      setError('');
    } catch (err) {
      setError(err.message);
      setWeather(null);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setCity(value);
    fetchSuggestions(value);
  };

  const handleSuggestionClick = (s) => {
    setCity(`${s.name}${s.state ? `, ${s.state}` : ''}, ${s.country}`);
    setSuggestions([]);
    fetchWeather(s.name, s.lat, s.lon);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchWeather(city);
  };

  const highlightMatch = (text, query) => {
    const i = text.toLowerCase().indexOf(query.toLowerCase());
    if (i === -1) return text;
    return (
      <>
        {text.slice(0, i)}
        <span className="highlight">{text.slice(i, i + query.length)}</span>
        {text.slice(i + query.length)}
      </>
    );
  };

  return (
    <div className="app">
      <form onSubmit={handleSearch} className="search-form">
        <div className="input-container">
          <input
            type="text"
            placeholder="Enter city..."
            value={city}
            onChange={handleInputChange}
            className="input"
          />
          {suggestions.length > 0 && (
            <ul className="suggestions">
              {suggestions.map((s, i) => (
                <li
                  key={`${s.name}-${s.lat}-${s.lon}-${i}`}
                  onClick={() => handleSuggestionClick(s)}
                  className="suggestion-item"
                >
                  {highlightMatch(s.name, city)}
                  {s.state ? `, ${highlightMatch(s.state, city)}` : ''}, {s.country}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit" className="search-button">Search</button>
      </form>

      {loading && <p className="loading">Loading weather...</p>}
      {error && <p className="error">{error}</p>}

      {weather && (
        <div className="weather-info">
          <h2>{weather.name}, {weather.sys.country}</h2>
          <p>{new Date(weather.dt * 1000).toLocaleString()}</p>
          <h3>{weather.main.temp}°C</h3>
          <div className="weather-icon">
            <img
              src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
              alt="weather icon"
            />
            <p>{weather.weather[0].main}</p>
          </div>
          <p>Humidity: {weather.main.humidity}%</p>
          <p>Wind: {weather.wind.speed} m/s</p>
        </div>
      )}
    </div>
  );
};

export default App;
