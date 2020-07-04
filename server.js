const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const genUsername = require("random-username-generator");
const genPassword = require("generate-password");
const passwordHash = require("password-hash");
const session = require("express-session");
const multer = require("multer");

const storage = multer.diskStorage({
    destination: function(req,file, cb) {
        cb(null, "react-grocery/src/static/images")
    },
    filename: function(req,file,cb) {
        cb(null, file.originalname)
    }
})

const upload = multer({storage: storage});


let hour = 3600000;


let cart_array = [];

let final_price = [];

let final_price_int;

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
    stock: {type: Number, default: 5},
    price: Number,
    category: String,
    product_tags: String,
    product_desc: String,
    product_image: String
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


            //Orders Schema
const pendingOrderSchema = new mongoose.Schema({
    ssn_id: String,
    price: Number,
    qty: Number,
    product_id: String
});

            //Orders Model

const PendingOrders = mongoose.model("Order", pendingOrderSchema);


            //Fulfilled Orders Table
const fulfilledOrdersSchema = new mongoose.Schema({
    ssn_id: String,
    price: Number,
    qty: Number,
    product_id: String,
    status: {type: String, default: "fulfilled"}
})

        //Fulfilled orders Model
const FulfilledOrder = mongoose.model("FulfilledOrder", fulfilledOrdersSchema);

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


let updatedPriceObject = [];
            //Add to cart route
app.post("/add-to-cart", (req,res) => {


    console.log(req.body);

    req.session.cart = cart_array;

    console.log(req.body.price);

    final_price.push(req.body.price);

    updatedPriceObject.push({
        id: req.body.id,
        price: req.body.price
    })


    console.log(updatedPriceObject);

    console.log(final_price);

    req.session.cart.push(req.body);


});

          //Show cart Route
app.get("/show-cart", (req,res) => {
      res.send(cart_array);
})

          //Delete item from cart
app.post("/delete-from-cart", (req,res) => {
    let id = req.body.id


    let updated_object_array_new = updatedPriceObject.filter((item) => {
        return (
            item.id !== id
        )
    })

    updatedPriceObject = updated_object_array_new;

    console.log("This is the updated Price array");

    console.log(updatedPriceObject);

     let new_array = cart_array.filter((item) => {
        return item.id !== id;
    })

    cart_array = new_array;

    final_price = [];

    cart_array.map((item) => {
        final_price.push(item.price);
    })

    final_price_int = final_price.reduce((first, second) => {
        return first + second;
    }, 0)

    let data_to_send_back = {
        final_price_int: final_price_int,
        new_array: new_array,
        other_array: updatedPriceObject
    }

    res.send(data_to_send_back);

})

        //Cart Price
app.get('/final-price', (req,res) => {

     final_price_int = final_price.reduce((first, second) => {
      return first + second;
  }, 0);

    console.log(final_price_int);

    let prices = {
        final_price: final_price_int
    }

    res.send(prices);
    

})


        //Updated Price
app.post("/update-price", (req,res) => {
    let newPrice = req.body.newPrice;
    let id = req.body.id;
    let user_qty = req.body.user_qty;
    let itemStock = req.body.itemStock;

    

    function countInArray(array, what) {
        var count = 0;
        for (var i = 0; i < array.length; i++) {
            if (array[i].id === what) {
                count++;
            }
        }
        return count;
    }

        //Variable that holds the outcome of the function above (count of items)
    let num_of_count = countInArray(updatedPriceObject, id);

        //If count is greater than one then update price
        //Otherwise insert the item as an object inside of the array

    if(num_of_count >= 1) {
        updatedPriceObject.map(item => {
            if(item.id === id) {
                item.price = newPrice;
                item.userQty = parseInt(user_qty);
                item.itemStock = itemStock;
            }
        })
        console.log(itemStock);
    } else {
        updatedPriceObject.push({
            price: newPrice,
            id: id,
            userQty: parseInt(user_qty),
            itemStock: itemStock
        });    
    }

    res.send(updatedPriceObject);

})

app.get("/updated_price", (req,res) => {
    res.send(updatedPriceObject);
})

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
app.post("/admin/add-product", upload.single("product_image"), (req,res) => {

    let file = req.file.originalname;

    let data = req.body;

    const new_product = new Product({
        name: data.name_input,
        price: data.product_price,
        category: data.select_input,
        product_tags: data.tag_input,
        stock: data.stock_input,
        product_image: file

    });
    new_product.save();

    res.send(true);
})



                            //INVENTORY

                //Inventory All
app.get("/inventory/all", (req,res) => {
    Product.find((err,result) => {

        result.map((item) => {
            if(item.stock === 0 || item.stock < 0) {
                Product.deleteOne({_id: item._id}, (deleteErr,deleteResult) => {
                    console.log("There is an item with negative stock");
                    console.log(deleteResult);
                })
            }
        })

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

                //Edit Product (GET Product Specs)
app.get("/inventory/edit-product/:productId", (req,res) => {
    let productId = req.params.productId;


    Product.findById(productId, (err,result) => {
        res.send(result);
    })
})


                //Edit Product (POST New Product)
app.post("/inventory/edit-product/update/:productId", (req,res) => {
    let productId = req.params.productId;

    let new_data = {
        productName: req.body.productName,
        productPrice: req.body.productPrice,
        productCategory: req.body.productCategory,
        productTags: req.body.productTags,
        productDesc: req.body.productDesc
    }

    console.log(req.body);

    Product.updateMany({_id: productId}, {
        name: new_data.productName,
        price: new_data.productPrice,
        category: new_data.productCategory,
        product_tags: new_data.productTags,
        product_desc: new_data.productDesc
    }, (err,result) => {
        res.send(result);
    });


})

app.post("/payment-success", (req,res) => {
    console.log("this is a req body thing");
    console.log(req.body);

    let data = req.body.itemsList;



    //Remove Stock from Item that has been bought
    data.map(item => {
        if(!item.itemStock) {
            item.userQty = 1;
            Product.find({_id: item.id}, (err,result) => {
                console.log("This is inside of the function")
    
                if(item.itemStock === undefined) {
                    item.itemStock = result[0].stock;

                    let newStock = item.itemStock - item.userQty;

                    
                    Product.findByIdAndUpdate(item.id, {stock: newStock}, (err,result) => {
                        console.log(result);
                    })

                }
            })

        } else {
            let newStock = item.itemStock - item.userQty;
            console.log("This is the new stock");
            console.log(newStock);
            Product.find({_id: item.id}, (err,result) => {
                console.log(result);
            })
    
            Product.findByIdAndUpdate(item.id, {stock: newStock}, (err,result) => {
                console.log(result);
            });
        }

        //Add value into order table
        const new_order = new PendingOrders({
            ssn_id: req.sessionID,
            price: item.price,
            qty: item.userQty,
            product_id: item.id
        });

        new_order.save();
    })

    updatedPriceObject = [];
    final_price = [];
    cart_array = [];

    res.send(true);
})



    //Admin order page numbers
app.get("/admin/main/num", (req,res) => {


    PendingOrders.find(function(err,result) {
        res.send(result);
    })

})


    //Admin Total Products Number for each category
app.get("/products-total", (req,res) => {

    let data = {
        cheese: [],
        veggie: [],
        meat: [],
        fruit: [],
        snack: [],
    }

    Product.find({category: "cheese"}, function(err,cheeseResult) {
        data.cheese = cheeseResult;

        Product.find({category: "meat"}, function(err,meatResult) {
            data.meat = meatResult
        })

        Product.find({category: "vegetable"}, function(err, veggieResult) {
            data.veggie = veggieResult;

        })

        Product.find({category: "fruit"}, function(err,fruitResult) {
            data.fruit = fruitResult;
        })

        Product.find({category: "snack"}, function(err,snackResult) {
            data.snack = snackResult
        })

        res.send(data);


    });


})

            //Get total number of cheese route
app.get("/products/total/cheese", (req,res) => {
    Product.find({category: "cheese"},(err,result) => {
        res.send(result);
    })
})

            //Get total number of veggie route
app.get("/products/total/veggie", (req,res) => {
    Product.find({category: "vegetable"}, (err,result) => {
        res.send(result);
    })
})

            //Get total number of snack route
app.get("/products/total/snack", (req,res) => {
    Product.find({category: "snack"}, (err,result) => {
        res.send(result);
    })
})

            //Get total number of meat route
app.get("/products/total/meats", (req,res) => {
    Product.find({category: "meat"}, (err,result) => {
        res.send(result);
    })
})


            //Get total number of fruit route
app.get("/products/total/fruit", (req,res) => {
    Product.find({category: "fruit"}, (err,result) => {
        res.send(result)
    })
}) 


        //Number of products in total

app.get("/totalProducts", (req,res) => {
    Product.find((err,result) => {
        res.send(result)
    })
})


        //Get number of pending orders
app.get("/orders/pending", (req,res) => {
    PendingOrders.find((err,result) => {
        res.send(result);
    }); 
})

        //Mark Order as fulfilled
app.post("/orders/fulfill-order", (req,res) => {
    let id = req.body.id;

    PendingOrders.find({ssn_id: id}, (err,result) => {
        console.log(result);
        const completed_order = new FulfilledOrder({
            ssn_id: id,
            price: result[0].price,
            qty: result[0].qty,
            product_id: result[0].product_id,
        });

        PendingOrders.deleteOne({_id: result[0]._id}, (err, result) => {
            console.log(result);
            console.log("Item has been deleted");

        })

        completed_order.save();
        
        res.send(true);
    })


    //Take data from req.body and submit it into the fulfiloled orders table


})

        //Fulfilled Orders Total
app.get("/orders/total/fulfilledOrders", (req,res) => {
    FulfilledOrder.find((err,result) => {
        res.send(result);
    })
})


        //Function to see if product stock is less than zero then delete it


// End of API Routes



    //Test Route (Delete Later)
app.get("/people", (req,res) => {
    let options = {
        name: "haseeb",
        age: 18
    }
    res.send(options);
})



// Serving React main file from Build Folder
app.get("*", (req,res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
})

let port = process.env.PORT || 5000;
app.listen(port, (req,res) => {
    console.log("Server has been start successfully at " + port);

});
