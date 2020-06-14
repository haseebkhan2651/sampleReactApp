const express = require("express");
const app = express();
const path = require("path");

//Serving Static Files
app.use(express.static(path.join(__dirname, "build")));

app.get("/people", (req,res) => {
    let options = {
        name: "haseeb",
        age: 18
    }
    res.send(options);
})


//Serving React main file from Build Folder
// app.get("*", (req,res) => {
//     res.sendFile(path.join(__dirname, "build", "index.html"));
// })

let port = process.env.PORT || 5000;
app.listen(port, (req,res) => {
    console.log("Server has been start successfully at " + port);
    
});


