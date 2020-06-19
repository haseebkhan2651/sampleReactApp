const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const genUsername = require("random-username-generator");
const genPassword = require("generate-password");
const passwordHash = require("password-hash");
const session = require("express-session");

let hour = 3600000;


//App Usage Queries
        //Serving Static Files
app.use(express.static(path.join(__dirname, "build")));
        //Body Parser JSON Config
app.use(bodyParser.json());
        //Body Parser Config
app.use(bodyParser.urlencoded({extended: true}));
        //Express sessions config
app.use(session({
    secret: "groceryapplicationsecret",
    resave: false,
    saveUninitialized: false,
    cookie: {secure: true, maxAge: hour}
}));
//End of App Usage Queries


//Database 
const connection = mongoose.connect('mongodb://localhost:27017/grocery', {useNewUrlParser: true, useUnifiedTopology: true});
        
            //Product Schema
const productSchema = new mongoose.Schema({
    name: String,
    stock: {type: Number, default: 1},
    price: Number,
    category: String,
    product_tags: String,
    product_desc: String
});
            //Product Model
const Product = mongoose.model("Product", productSchema);

            //User Schema
const adminUserSchema = new mongoose.Schema({
    username: String,
    password: String,
    date_created: {type: Date, default: Date.now()}
});

            //User Model
const AdminUser = mongoose.model("AdminUser", adminUserSchema);




//Global Variables

let admin_user = {
    message: "User not set",
    username: null,
    password: null,
    session_status: {
        isSet: false
    }
}

//End of Global Variables

//API Routes

            //Status Routes
app.get("/status", (req,res) => {
    res.send(admin_user);
});


            //Add to cart route
app.post("/add-to-cart", (req,res) => {
    res.send(true);
});

            //Create an admin user
app.post("/create-admin-user", (req,res) => {
    let generated_username = genUsername.generate();
    let generated_password = genPassword.generate({
        length: 6,
        numbers: true
    });


    let hashed_password = passwordHash.generate(generated_password);

    admin_user.message = "User set";
    admin_user.password = generated_password;
    admin_user.username = generated_username;

    

    console.log(generated_username);
    const user = new AdminUser({
        username: generated_username,
        password: hashed_password
    });
    user.save();
   
 

    res.send(true);
})


            //API Route to Validate if a user is an admin
app.post("/validate-admin", (req,res) => {

    let username = req.body.username;
    let password = req.body.password;

   

    AdminUser.find({username: username }, (err,result) => {
        if(result.length > 0) {
            let compared_password = passwordHash.verify(password,result[0].password);

            if(compared_password) {
                admin_user.session_status.isSet = true;
                req.session.username = result[0].username;
                res.send("Password has been confirmed");
            } else {
                res.send("Password is incorrect");
            }
        } else {
            res.send("Username isn't correct");
        }

    });
                             
})


        //POST Route for adding a product
app.post("/admin/add-product", (req,res) => {
    let data = req.body;

    const new_product = new Product({
        name: data.productName,
        price: data.productPrice,
        category: data.productCategory,
        product_tags: data.productTags,
        product_desc: data.productDesc
    });
    new_product.save();

    res.send(true);
})



                            //INVENTORY 

                //Inventory All
app.get("/inventory/all", (req,res) => {
    Product.find((err,result) => {
        res.send(result);
    })
})


                //Inventory Cheese
app.get("/inventory/cheese", (req,res) => {

    Product.find({category: "cheese"}, (err,result) => {
        res.send(result);
    });

});

                //Inventory Meat
app.get("/inventory/meat", (req,res) => {

    Product.find({category: "meat"}, (err,result) => {
        res.send(result);
    });

});

                //Inventory Snacks
app.get("/inventory/snack", (req,res) => {

    Product.find({category: "snack"}, (err,result) => {
        res.send(result);
    });

});

                //Inventory Vegetable
app.get("/inventory/vegetable", (req,res) => {

    Product.find({category: "vegetable"}, (err,result) => {
        res.send(result);
    });

});

                //Delete product
app.post("/inventory/delete-product", (req,res) => {
    let id = req.body.id;

    Product.deleteOne({_id: id}, function(err) {
        res.send(true);
    })
    

})




// End of API Routes




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


