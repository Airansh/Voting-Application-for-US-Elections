const validation = require('../src/validation');

describe('validation', () => {
    describe('validateRegistration', () => {
        const valid = {
            email: ' Jane@Example.com ',
            first: 'Jane',
            last: 'Doe',
            address: '1 Main St',
            city: 'Iowa City',
            zipCode: '52240',
            age: '30',
            id: 'DMV123',
        };

        it('accepts and normalises a valid request', () => {
            const result = validation.validateRegistration(valid);
            expect(result.valid).toBeTrue();
            expect(result.value.email).toBe('jane@example.com');
            expect(result.value.age).toBe(30);
        });

        it('rejects voters under the minimum voting age', () => {
            const result = validation.validateRegistration({ ...valid, age: '17' });
            expect(result.valid).toBeFalse();
        });

        it('rejects invalid zip codes and emails', () => {
            expect(validation.validateRegistration({ ...valid, zipCode: '5224' }).valid).toBeFalse();
            expect(validation.validateRegistration({ ...valid, email: 'not-an-email' }).valid).toBeFalse();
        });

        it('rejects missing fields', () => {
            const result = validation.validateRegistration({ ...valid, city: '  ' });
            expect(result.valid).toBeFalse();
            expect(result.errors).toContain('city is required');
        });

        it('handles a missing payload', () => {
            expect(validation.validateRegistration(undefined).valid).toBeFalse();
        });
    });

    describe('validatePassword', () => {
        it('requires at least 8 characters with a letter and a number', () => {
            expect(validation.validatePassword('short1').valid).toBeFalse();
            expect(validation.validatePassword('onlyletters').valid).toBeFalse();
            expect(validation.validatePassword('12345678').valid).toBeFalse();
            expect(validation.validatePassword('Password1').valid).toBeTrue();
        });
    });

    describe('validateDetailsChange', () => {
        it('requires a 5 digit zip code', () => {
            expect(validation.validateDetailsChange({ address: 'a', city: 'b', zipcode: '52240' }).valid).toBeTrue();
            expect(validation.validateDetailsChange({ address: 'a', city: 'b', zipcode: 'abc' }).valid).toBeFalse();
        });
    });

    describe('validatePrecinct', () => {
        it('requires a zip code and its last four digits', () => {
            const precinct = {
                zipCode: '52240',
                lastFourDigits: '1234',
                votingLocation: 'City Hall',
                pollingManager: 'Pat',
                stateElectionContact: 'elections@example.com',
            };
            expect(validation.validatePrecinct(precinct).valid).toBeTrue();
            expect(validation.validatePrecinct({ ...precinct, lastFourDigits: '12' }).valid).toBeFalse();
        });
    });

    describe('validateRace', () => {
        const race = {
            raceTitle: 'Mayor',
            precinctZipCode: '52240',
            candidates: [{ name: 'A', party: 'X' }, { name: 'B', party: 'Y' }],
        };

        it('accepts candidates as an array or JSON string', () => {
            expect(validation.validateRace(race).valid).toBeTrue();
            const fromJson = validation.validateRace({ ...race, candidates: JSON.stringify(race.candidates) });
            expect(fromJson.valid).toBeTrue();
            expect(fromJson.value.candidates.length).toBe(2);
        });

        it('drops blank candidates and requires at least one', () => {
            expect(validation.validateRace({ ...race, candidates: [{ name: ' ', party: 'X' }] }).valid).toBeFalse();
        });

        it('rejects duplicate candidate names', () => {
            const dup = { ...race, candidates: [{ name: 'A', party: 'X' }, { name: 'a', party: 'Y' }] };
            expect(validation.validateRace(dup).valid).toBeFalse();
        });
    });

    describe('validateElection', () => {
        const election = {
            electionTitle: 'General',
            races: 'Mayor',
            startTime: '2024-11-05T07:00',
            endTime: '2024-11-05T20:00',
        };

        it('accepts a valid election and converts times to SQL format', () => {
            const result = validation.validateElection(election);
            expect(result.valid).toBeTrue();
            expect(result.value.startTime).toBe('2024-11-05 07:00:00');
            expect(result.value.endTime).toBe('2024-11-05 20:00:00');
        });

        it('rejects an end time before the start time', () => {
            const result = validation.validateElection({ ...election, endTime: '2024-11-05T06:00' });
            expect(result.valid).toBeFalse();
        });
    });
});
