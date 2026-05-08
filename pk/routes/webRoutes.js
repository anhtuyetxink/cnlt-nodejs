const express = require('express');
const gameController = require('../controllers/gameController');

const router = express.Router();

router.get('/', gameController.showLobby);
router.get('/game', gameController.showGame);

module.exports = router;
