import express from "express";
import viewEngine from "./config/viewEngine";
import initWebRoutes from "./routes/web";
import bodyParser from "body-parser";
require("dotenv").config();


let app = express();

// config view engine
viewEngine(app);

// parser request to json
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// init web routes
initWebRoutes(app);

let port = process.env.PORT || 8080;

app.listen( port, () => {
    console.log("Chatbot đang chạy ở cổng: " + port);
});
