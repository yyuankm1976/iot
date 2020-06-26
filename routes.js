/**
 * The following file contains the implementation for the route that is specific for this cAPI instance
 * Please note that this should be the only file that is edited
 */

const express = require('express');
const router = express.Router();
const { executeQuery } = require('./base/connectors/postgres/postgres');
const { ValidationError } = require('./base/utils/errors');
const VERSION = 1;

// Healthcheck and version check for app
router.get('/1/', (req, res) => {
    res.status(200).send(`Data API version ${VERSION} up and running!`);
});

/**
 * Orchestrates the actions for this cAPI instance
 * Example route implementation that demonstrates how to access common express request attributes
 * Please note that the example demonstrates how to implement a route that makes a Postgres database call
 */
router.post('/1/q/cidn/:cidn', async (req, res, next) => {
    // Retrieve parameters from Express request
    const { cidn } = req.params;
    const { logger } = res.locals;
    const accountNumbers = JSON.parse(req.header('accountNumbers'));
    const {
        sort: { field: sortField, direction: sortDirection },
        page: { number: pageNumber, size: pageSize }
    } = req.body;
    // Construct SQL query
    const query = `select rules.rule_id, rules.rule_type, rules.description, rules.create_date_time, rules.last_updated_time, rules.last_triggered_time, rules.last_triggeredby, rules.is_enabled, groups.group_id, groups.name from test.rules rules INNER JOIN test.groups groups ON rules.group_id = groups.group_id WHERE rules.cidn=${cidn} and rules.acct_nbr::bigint in (${accountNumbers.join(
        ', '
    )}) GROUP BY rules.rule_id, groups.group_id, groups.name order by ${sortField} ${sortDirection} limit ${pageSize} offset ${pageNumber *
        pageSize};`;
    logger.info(`QUERY: ${query}`);
    try {
        // Execute SQL query on Postgres database
        const databaseResponse = await executeQuery(query, logger);
        logger.info(`DATABASE RESPONSE: ${JSON.stringify(databaseResponse)}`);
        res.status(200).json({ data: databaseResponse });
    } catch (e) {
        logger.error(e);
        next(new ValidationError(`Database error: ${e.message}`));
    }
});

module.exports = router;
