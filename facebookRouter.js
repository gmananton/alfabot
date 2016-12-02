/**
 * Created by U_M0PQL on 02.11.2016.
 *
 * обработчик get-запросов для удобного тестирования связки nodeJs - java-middle
 */
const express    = require('express')
const router = express.Router();




//Главная страница для удобного тестирования (все запросы сведены в html-странице)
router.get('/dd', function(req, res) {
    res.render('debugMainPage', { });
});



module.exports = router;