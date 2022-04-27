var fs = require('fs'); 
var path = require('path');
setImmediate (function cbImmediate(){
    fs.exists(path.join(__dirname, "Hello.txt"), (exists) =>{
        if (exists)
            fs.readFile (path.join(__dirname, "Hello.txt"),'utf8', function(err, data){
                console.log(data);
            });
    });
});
setTimeout (function cbTimeout() {
    fs.unlink(path.join(__dirname, "Hello.txt"),(err => {
        if (err) console.log(err);
        else {
            console.log("\nDeleted file: Hello.txt");
        }
    })
    );
    console.log("Yo")
},2);