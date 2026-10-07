const elections = require('../src/elections');

describe('elections', () => {
    describe('getElectionStatus', () => {
        const election = { Start_Time: '2024-03-01 08:00:00', End_Time: '2024-03-01 20:00:00', status: 'open' };

        it('is upcoming before the start time', () => {
            expect(elections.getElectionStatus(election, new Date(2024, 2, 1, 7, 59))).toBe('upcoming');
        });

        it('is active between the start and end time', () => {
            expect(elections.getElectionStatus(election, new Date(2024, 2, 1, 12, 0))).toBe('active');
        });

        it('has ended after the end time', () => {
            expect(elections.getElectionStatus(election, new Date(2024, 2, 1, 20, 1))).toBe('ended');
        });

        it('is closed when an admin closed it, regardless of time', () => {
            const closed = { ...election, status: 'closed' };
            expect(elections.getElectionStatus(closed, new Date(2024, 2, 1, 12, 0))).toBe('closed');
        });
    });

    describe('parseJsonArray', () => {
        it('parses JSON strings', () => {
            expect(elections.parseJsonArray('[{"name":"A"}]')).toEqual([{ name: 'A' }]);
        });

        it('returns arrays unchanged', () => {
            const list = [{ name: 'A' }];
            expect(elections.parseJsonArray(list)).toBe(list);
        });

        it('wraps a single object', () => {
            expect(elections.parseJsonArray({ name: 'A' })).toEqual([{ name: 'A' }]);
        });

        it('returns an empty array for null or invalid JSON', () => {
            expect(elections.parseJsonArray(null)).toEqual([]);
            expect(elections.parseJsonArray('not json')).toEqual([]);
        });
    });

    describe('hasVotedInRace', () => {
        const history = JSON.stringify([{ race: 'Mayor', name: 'A', party: 'X' }]);

        it('detects a previous vote in the race', () => {
            expect(elections.hasVotedInRace(history, 'Mayor')).toBeTrue();
        });

        it('ignores votes in other races', () => {
            expect(elections.hasVotedInRace(history, 'Council')).toBeFalse();
            expect(elections.hasVotedInRace(null, 'Mayor')).toBeFalse();
        });
    });
});
