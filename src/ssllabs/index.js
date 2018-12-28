const fs = require('fs');
const path = require('path');
const flatten = require('flat');
const child_process = require('child_process');
const urlParser = require('url');
const crypto = require('crypto');
const isEmpty = require('lodash.isempty');
const logger = require('../utils/logger');

const filterSSLLabsData = (report = {}) => {
    const { statistics = {} } = report;
    return flatten(statistics);
};


function pathNameFromUrl(url) {
  const parsedUrl = urlParser.parse(url),
    pathSegments = parsedUrl.pathname.split('/');

  pathSegments.unshift(parsedUrl.hostname);

  if (!isEmpty(parsedUrl.search)) {
    const md5 = crypto.createHash('md5'),
      hash = md5
        .update(parsedUrl.search)
        .digest('hex')
        .substring(0, 8);
    pathSegments.push('query-' + hash);
  }

  return pathSegments.filter(Boolean).join('-');
}

const reportDir = path.join(__dirname, '../../reports/ssllabs-results', pathNameFromUrl(url));

const getSSLLabsFile = (url = '') => {
    try {

        const folders = fs.readdirSync(reportDir);

        const sortFoldersByTime = folders.sort(function(a, b) {
            return new Date(b) - new Date(a);
        });

        const newestFolder = sortFoldersByTime[sortFoldersByTime.length - 1];

        const ssllabsFile = fs.readFileSync(path.join(dir, newestFolder, 'ssllabs.html'));

        return Promise.resolve(ssllabsFile);
    } catch (err) {
        console.log(err);
        const message = `Failed to get ssllabs file for ${url}`;
        logger.warn(message);
        return Promise.reject(message);
    }
};

const getData = async url => {
    return new Promise(async (resolve, reject) => {
        try {
            const child = child_process.spawn('bash', [path.join(__dirname, './ssllabs.sh'), url, reportDir]);

            child.on('exit', async () => {
                logger.info(`Finished getting data for ${url}, trying to get the results`);
                const data = await getSSLLabsFile(url);
                resolve(filterSSLLabsData(data));
            });

            child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);
        } catch (err) {
            logger.warn(`Failed to get data for ${url}`, err);
            reject(`Failed to get data for ${url}`);
        }
    });
};

module.exports = {
    getSSLLabsFile,
    filterSSLLabsData,
    getData
};
