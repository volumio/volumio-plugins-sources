'use strict';

const handler = require(__dirname + '/handler');

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    handler.index(req, res);
})

router.get('/preview', (req, res) => {
    handler.preview(req, res);
});

router.get('/volumio', (req, res) => {
    handler.volumio(req, res);
});

router.post('/api/:namespace/:method', (req, res) => {
    const {namespace, method} = req.params;
    handler.api(namespace, method, req.body, res);
});

router.get('/api/:namespace/:method', (req, res) => {
    const {namespace, method} = req.params;
    handler.api(namespace, method, req.query, res);
});

module.exports = router;
