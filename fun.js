var express = require('express');

var app = express();

var bodyParser = require('body-parser');

var path = require('path');

var multer = require('multer');

var cfenv = require('cfenv');

var watson = require('watson-developer-cloud');

var ffmpeg = require('ffmpeg');

var stat = require('fs').statSync;

var zipFolder = require('zip-folder');


app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ "extended": false }));

app.use(express.static(__dirname + '/public'));

var storage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, './public/class/'); // set the destination
    },
    filename: function(req, file, callback) {

        callback(null, 'NotUseful.mp4'); // set the file name and extension
    }
});

var upload = multer({ storage: storage });

app.upload = upload;

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

var VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3');

var fs = require('fs');

var visualRecognition = new VisualRecognitionV3({
    version: '2018-03-19',
    iam_apikey: 'aaIFu-fHWBXgj09eVarEQUFlIaTeH9bpgvRqHIJxu_8N'
});

function tosplit(request) {
    var value = request;
    valueArray = value.split("\\");
    return valueArray;
}

function extsplit(request) {
    var value = request;
    nameArray = value.split('.');
    return nameArray;
}

function makeZip(pathname, zipname) {

    zipFolder(pathname, zipname, function(err) {

        if (err) {
            console.log('oh no!', err);

        } else {

            console.log('Zip Created...');
        }
    });
}

app.post('/upload', app.upload.single('video-upl'), function(req, res) {

    var video_file = fs.createReadStream('https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4'); // Storing File path
    var video_String = JSON.stringify(video_file); // Converting Json into String of req.file.path
    var video_res = JSON.parse(video_String); // Parsing req.file.path

    var valueArray = tosplit(video_res.path); //Splitting Path in values

    var filenme = 'big_buck_bunny_720p_1mb.mp4'; // Requesting Original File name
    var filnameStringify = JSON.stringify(filenme); //Stringify file original name
    var filnameParse = JSON.parse(filnameStringify); //Parsing file Original name

    var filename = extsplit(filnameParse); // Spliting File name from path

    var finalpath = './public/class/' + valueArray[2]; // Path to Video for Extracting Images

    var destpath = './public/class/' + filename[0] + '/'; //Destinaton Path to Store Images

    var zipdest = './public/class/' + filename[0]; //Destination of File to be Zip

    var articleid = extsplit(valueArray[2]); //For ArticleId through Video Name

    try {
        var process = new ffmpeg(finalpath);
        process.then(function(video) {
            // Callback mode
            video.fnExtractFrameToJPG(destpath, {
                frame_rate: 1,
                number: 50,
                keep_pixel_aspect_ratio: true,
                keep_aspect_ratio: true,
                file_name: filename[0] + '_%s'
            }, function(error, files) {

                if (!error) {
                    var fileJsonStr = JSON.stringify(files);

                    makeZip(zipdest, './public/class/' + filename[0] + '.zip');

                    console.log(fileJsonStr);

                    // res.send(fileJsonStr).responseJSON;
                }
            });
        }, function(err) {
            console.log('Error: ' + err);
        });
    } catch (e) {
        console.log(e.code);
        console.log(e.msg);
    }
});
app.listen(3000);