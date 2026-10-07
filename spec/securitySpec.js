const security = require('../src/security');

describe('security', () => {
    describe('hashPassword / verifyPassword', () => {
        it('verifies the correct password against its hash', () => {
            const hash = security.hashPassword('Secret123');
            expect(security.isHashed(hash)).toBeTrue();
            expect(security.verifyPassword('Secret123', hash)).toBeTrue();
        });

        it('rejects a wrong password', () => {
            const hash = security.hashPassword('Secret123');
            expect(security.verifyPassword('Secret124', hash)).toBeFalse();
        });

        it('uses a random salt for every hash', () => {
            expect(security.hashPassword('Secret123')).not.toEqual(security.hashPassword('Secret123'));
        });

        it('still accepts legacy plain-text passwords', () => {
            expect(security.isHashed('Password@123')).toBeFalse();
            expect(security.verifyPassword('Password@123', 'Password@123')).toBeTrue();
            expect(security.verifyPassword('password@123', 'Password@123')).toBeFalse();
        });

        it('rejects missing passwords and malformed hashes', () => {
            expect(security.verifyPassword('x', null)).toBeFalse();
            expect(security.verifyPassword(undefined, 'abc')).toBeFalse();
            expect(security.verifyPassword('x', 'scrypt$')).toBeFalse();
        });
    });

    describe('tokens', () => {
        it('generates unique 64 character hex tokens', () => {
            const a = security.generateToken();
            expect(a).toMatch(/^[0-9a-f]{64}$/);
            expect(a).not.toEqual(security.generateToken());
        });

        it('hashes tokens deterministically', () => {
            expect(security.hashToken('abc')).toEqual(security.hashToken('abc'));
            expect(security.hashToken('abc')).not.toEqual('abc');
        });
    });

    describe('generateVoterId', () => {
        it('uses the initials followed by four digits', () => {
            expect(security.generateVoterId('jane', 'doe')).toMatch(/^JD\d{4}$/);
        });

        it('handles missing names', () => {
            expect(security.generateVoterId('', undefined)).toMatch(/^XX\d{4}$/);
        });
    });
});
