/*global describe, it */
import fs from 'fs';
import expect from 'expect';

import { generate } from '../lib/generators/node_5_es6';

const CLIENT_FILE = 'client.js';

function generateClient() {
  const json = fs.readFileSync(`${process.cwd()}/reference-api/api-light-service.json`).toString('utf-8');
  const clientFiles = generate(JSON.parse(json));
  clientFiles.forEach((file) => {
    fs.writeFileSync(`${process.cwd()}/test/dist/${file.name}`, file.contents);
  });
}

generateClient();

const Client = require(`./dist/${CLIENT_FILE}`).default;
const CLIENT_HOST = 'http://localhost:9020';
const client = new Client(CLIENT_HOST);

function createFlight (number) {
  return client.Flights.post({
    data: { number }
  });
}

function addPassenger (name, flightId) {
  return client.Flights.postPassengersById(flightId, {
    data: { name }
  });
}

function getFlights () {
  return client.Flights.get();
}

function getFlightsByIds (ids) {
  return client.Flights.get({
    id: ids
  });
}

function getFlightByNumber (number) {
  return client.Flights.get({
    number: number
  });
}

function getFlightById (id) {
  return client.Flights.getById(id);
}

function patchFlightById (id, updatedNumber) {
  return client.Flights.patchById(id, {
    data: {
      number: updatedNumber
    }
  });
}

function deleteFlightById (id) {
  return client.Flights.deleteById(id);
}

describe('node node_5_es6 client', () => {
  it('should have access to client', () => {
    expect(client.getHost()).toEqual(CLIENT_HOST);
  });

  it('should have expected resource classes', () => {
    expect(client.Flights).toBeA('object');
  });

  it('should POST with form data', (done) => {
    const flightNumber = `flight_${Date.now()}`;
    createFlight(flightNumber).then((result) => {
      expect(result.number).toEqual(flightNumber);
      done();
    }).catch((error) => {
      done(error);
    });
  });

  it('should POST with json data', (done) => {
    const flightNumber = `flight_${Date.now()}`;
    const passengerName = `testPassenger_${Date.now()}`;
    createFlight(flightNumber)
      .then((flight) => {
        return addPassenger(passengerName, flight.id);
      })
      .then((passenger) => {
        expect(passenger.name).toEqual(passengerName);
        done();
      })
      .catch((error) => {
        done(error);
      });
  });

  it('should GET flights', (done) => {
    const flightNumber = `flight_${Date.now()}`;
    createFlight(flightNumber)
      .then(() => {
        return getFlights();
      })
      .then((flights) => {
        expect(flights.length > 0).toBe(true);
        done();
      })
      .catch((error) => done(error));
  });

  it('should GET flights by id', (done) => {
    const flightNumber1 = `flight1_${Date.now()}`;
    const flightNumber2 = `flight2_${Date.now()}`;

    Promise.all([createFlight(flightNumber1), createFlight(flightNumber2)])
      .then(([flight1, flight2]) => {
        return getFlightsByIds([flight1.id, flight2.id]);
      })
      .then((flights) => {
        expect(flights.length).toBe(2);

        const flight1 = flights.find((f) => f.number == flightNumber1);
        const flight2 = flights.find((f) => f.number == flightNumber2);

        expect(flight1).toExist();
        expect(flight2).toExist();

        done();
      })
      .catch((error) => done(error));
  });

  it('should GET flight by number', (done) => {
    const flightNumber = `flight_${Date.now()}`;
    createFlight(flightNumber)
      .then(() => {
        return getFlightByNumber(flightNumber);
      })
      .then((flights) => {
        expect(flights.length).toBe(1);
        expect(flights[0].number).toEqual(flightNumber);
        done();
      })
      .catch((error) => done(error));
  });

  it('should GET flight by number and return an empty list', (done) => {
    getFlightByNumber('flight_does_not_exist')
      .then((flights) => {
        expect(flights.length).toBe(0);
        done();
      })
      .catch((error) => done(error));
  });

  it('should GET flight by id (url param)', (done) => {
    const flightNumber = `flight_${Date.now()}`;
    createFlight(flightNumber)
      .then((flight) => {
        return getFlightById(flight.id);
      })
      .then((flight) => {
        expect(flight.number).toEqual(flightNumber);
        done();
      })
      .catch((error) => done(error));
  });

  it('should PATCH a flight', (done) => {
    const flightNumber = `flight_${Date.now()}`;
    const updatedFlightNumber = `${flightNumber}_updated`;
    createFlight(flightNumber)
      .then((flight) => {
        return patchFlightById(flight.id, updatedFlightNumber);
      })
      .then((flight) => {
        expect(flight.number).toEqual(updatedFlightNumber);
        done();
      })
      .catch((error) => done(error));
  });

  it('should PATCH a flight and reject', (done) => {
    const flightNumber = `flight_${Date.now()}`;
    const updatedFlightNumber = `${flightNumber}_updated`;
    const invalidId = 999499999;

    createFlight(flightNumber)
      .then(() => {
        return patchFlightById(invalidId, updatedFlightNumber);
      })
      .then(() => {
        throw new Error('Got success when expecting failure');
      })
      .catch((error) => {
        expect(error.status).toExist();
        expect(error.status).toBe(404);
        done();
      });
  });

  it('should delete a flight', (done) => {
    const flightNumber = `flight_${Date.now()}`;
    createFlight(flightNumber)
      .then((flight) => {
        return deleteFlightById(flight.id);
      })
      .then((flight) => {
        expect(flight).toNotExist();
      })
      .then(() => {
        return getFlightByNumber(flightNumber);
      })
      .then((flights) => {
        expect(flights.length).toEqual(0);
        done();
      })
      .catch((error) => done(error));
  });
});
