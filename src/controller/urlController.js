const shortId = require("shortid");
const urlModel = require("../Models/urlModel");
const redis = require('redis');
const { promisify } = require('util');

const redisClient = redis.createClient(
  14513,
  "redis-14513.c264.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);

redisClient.auth("Lio9hkOPUbqWD6XintERZYTLHNSWl9xv", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

const urlValidaton =/^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})?$/

const shorternUrl = async function(req, res){
  try {
     let { longUrl } = req.body
          
     if(!longUrl) return res.status(400).send({status:false, message:"Please give the longUrl in the Body"})

     if(!urlValidaton.test(longUrl)) return res.status(400).send({status:false, message:"Please give valid Url "})

     const isData = await urlModel.findOne({longUrl}).select({_id:0,__v:0,createdAt:0,updatedAt:0});

     if(isData) return res.status(200).send({status:true,message:"That's  url has already generated short url ." , data:isData})

     const urlCode = shortId.generate().toLowerCase();

     const shortUrl = `http://localhost:3000/${urlCode}`  //e.g => http://localhost:3000/dosfiwo;

     req.body.urlCode =urlCode 
     req.body.shortUrl =shortUrl
          
     const saveData = await urlModel.create(req.body);

     return  res.status(201).send({ msg:"succesfull",data:{longUrl:saveData.longUrl,shortUrl:saveData.shortUrl,urlCode:saveData.urlCode}})

 }catch(err){return  res.status(500).send({status:false,message:err.message})}
}

const getUrl = async function(req, res){
 try {
    const urlCode = req.params.urlCode;

    const caching = await GET_ASYNC(`${req.params.urlCode}`);

    if(caching){
      console.log(" form caching ")
      return res.status(302).redirect(JSON.parse(caching));
    }else{
      const isData =await urlModel.findOne({urlCode});

      if(!isData) return  res.status(404).send({status:false,message:"This short is not present in our database"});
      
      await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(isData.longUrl));
      
      return res.status(302).redirect(isData.longUrl)
    }
 }catch(err){return  res.status(500).send({status:false,message:err.message})}
}

module.exports = { shorternUrl ,getUrl}