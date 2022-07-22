const express = require('express');
const router = express.Router();

const { shorternUrl,getUrl} = require('../controller/urlController')

router.post('/url/shorten',shorternUrl)

router.get('/:urlCode',getUrl)

router.all("*",(req,res)=> res.status(404).send({message:"URL NOT FOUND"}));

module.exports = router