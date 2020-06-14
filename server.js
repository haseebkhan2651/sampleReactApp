const express = require("express");
const app = express();


//Serving Static Files
app.use(express.static(path.join(__dirname, "react-grocery", "build")));

app.get("/people", (req,res) => {
    let options = {
        name: "haseeb",
        age: 18
    }
    res.send(options);
})



app.get("*", (req,res) => {
    res.sendFild(path.join(__dirname, "react-grocery", "build", "index.html"));
})

let port = process.env.PORT || 5000;
app.listen(port, (req,res) => {
    console.log("Server has been start successfully at " + port);
    
});


