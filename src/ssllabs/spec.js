const fs = require('fs-extra');
const path = require('path');
const child_process = require('child_process');
const { getSSLLabsFile, filterSSLLabsData, getData } = require('./');
const ssllabsTestData = require('../../test/mock-data/ssllabs.json');
const ssllabsTestDataFlat = require('../../test/mock-data/ssllabs-flat.json');

jest.mock('child_process', () => {
    return {
        spawn: jest.fn(() => ({
            on: jest.fn((process, callback) => {
                callback();
            }),
            stdout: { pipe: jest.fn() },
            stderr: { pipe: jest.fn() }
        }))
    }
});

describe('ssllabs', () => {

    beforeEach(() => {
        const today = new Date();

        const filePath = path.join(__dirname, '../../reports/ssllabs-results/www.test.co.uk', today.toISOString());
        fs.ensureDirSync(filePath);

        fs.writeJsonSync(path.join(filePath, 'ssllabs.json'), ssllabsTestData);
    })

    afterEach(() => {
        fs.removeSync(path.join(__dirname, '../../../reports/ssllabs-results/www.test.co.uk'));
    });

    describe('getSSLLabsFile', () => {

        it('finds and resolves the ssllabs results for the given url', async () => {

            const result = await getSSLLabsFile('www.test.co.uk');

            expect(result).toEqual(ssllabsTestData);

        });

        it('rejects when no file can be found', async () => {
            fs.removeSync(path.join(__dirname, '../../reports/ssllabs-results/www.test.co.uk'));
            await expect(getSSLLabsFile('www.test.co.uk')).rejects.toEqual('Failed to get ssllabs file for www.test.co.uk');
        });

    });

    describe('filterSSLLabsData', () => {

        it('returns the `statistics` from the browser time file and flattens the data', () => {

            const testData = {
                statistics: {
                    property1: {
                        property1A: 'property1AValue'
                    },
                    property2: 'property2Value'
                }
            }

            const data = filterSSLLabsData(testData);

            expect(data['property1.property1A']).toEqual('property1AValue');
            expect(data.property2).toEqual('property2Value');



        });

    });

    describe('getData', () => {

        it('calls the shell script to get the data from ssllabs docker image and resolves with the ssllabs file flattened when succesfully finished', async () => {

            const data = await getData('www.test.co.uk');
            expect(child_process.spawn).toBeCalledWith('bash', [path.join(__dirname, './ssllabs.sh'), 'www.test.co.uk']);

            expect(data).toEqual(ssllabsTestDataFlat);


        });

        it('rejects when child process fails', async () => {

            child_process.spawn.mockImplementation(() => {
                throw new Error('Failed');
            })

            await expect(getData('www.test.co.uk')).rejects.toEqual('Failed to get data for www.test.co.uk');

        });


    });

});