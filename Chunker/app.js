var express = require('express');
var fs = require("fs");
var formidable = require('formidable');
var splitFileStream = require("split-file-stream");
let outputPath = __dirname + "/Chunks/";
var customSplit = splitFileStream.getSplitWithGenFilePath((n) => `${outputPath}${(Math.random().toString(36).substr(2, 3) + "-" + Math.random().toString(36).substr(2, 3) + "-" + Math.random().toString(36).substr(2, 4).toUpperCase())}`)
const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
var files1=[];
var app = express();

app.use(express.static('public'));

function save(files,key,fname){
   var data = {}
   data= []
   for(var i=0;i < files.length;i++){
      var mykey = crypto.createCipher('aes-128-cbc', key);
      var mystr = mykey.update(files[i], 'utf8', 'hex');
      mystr += mykey.final('hex');
      data.push(mystr);
   }
   let outputPath = __dirname + "/Keys/"+fname+".json";
   fs.writeFile ((outputPath), JSON.stringify(data), function(err) {
    if (err) throw err;
    console.log('complete');
    })

}
function print(data,fname,key){
   let outputPath = __dirname + "/Outputs/"+fname+".txt";
   var dat=[];
   for(var i=0;i < data.length;i++){
      var mykey = crypto.createDecipher('aes-128-cbc', key);
      var mystr = mykey.update(data[i], 'hex', 'utf8')
      mystr += mykey.final('utf8');
      dat.push(mystr);

   }
  
 splitFileStream.mergeFilesToDisk(dat, outputPath, () => {
});
}

app.get('/', function (req, res) {
   res.sendFile( __dirname + "/" + "index.html" );
})

app.post('/file', function (req, res) {
  
   var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
         var path = files.file.path;
         var key=fields.key;
         var size=fields.size;
         var fname=fields.name;
         var readStream = fs.createReadStream(path); 
         customSplit(readStream, size, (filePaths) => {
            files1=filePaths;
            save(files1,key,fname);
            res.sendFile( __dirname + "/" + "show.html" );
  
 });
 });
 })

app.post('/merge', function (req, res) {
   var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      
      var dat = [];
      var path = files.file.path;
      var key=fields.key;
      var fname=fields.name;
      fs.readFile(path, (err, datum) => {
      if (err) throw err;
      let data = JSON.parse(datum);
      print(data,fname,key);
      console.log("Merge Successful!")
      res.sendFile( __dirname + "/" + "index.html" );
   });
 });
})
app.get('/show', function (req, res) {
   res.sendFile( __dirname + "/" + "show.html" );
})
var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Example app listening at http://%s:%s", host, port)
})