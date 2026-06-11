const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const QRCode = require("qrcode");
const AWS = require("aws-sdk");
const s3 = new AWS.S3({ region: "us-east-1" });
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand
} = require("@aws-sdk/lib-dynamodb");

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname)));

const client = new DynamoDBClient({
  region: "us-east-1"
});
const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "YOUR_RDS_ENDPOINT"
  user: "YOUR_DB_USERNAME"
  password: "YOUR_DB_PASSWORD"
  database: "YOUR_DATABASE"
});

connection.connect((err) => {
  if (err) {
    console.log("RDS Connection Failed:", err);
  } else {
    console.log("RDS Connected");
  }
});
const ddbDocClient =
  DynamoDBDocumentClient.from(client);

let queueCounter = 0;

app.get("/get-queue-ticket", (req, res) => {

  queueCounter++;

  res.json({
    success: true,
    queuePosition: queueCounter,
    recommendedTimer: 50
  });

});

app.post("/book", async (req, res) => {

  try {

    const {
      devoteeName,
      mobile,
      email,
      sevaName,
      sevaDate
    } = req.body;

    if (
      !devoteeName ||
      !mobile ||
      !sevaName ||
      !sevaDate
    ) {
      return res.status(400).json({
        success: false,
        error: "Missing Parameters"
      });
    }

    let amount = 500;

    if (
      sevaName ===
      "300 Special Darshanam"
    ) {
      amount = 300;
    }

    const prefixes = [
      "SVB",
      "TSP",
      "DVP",
      "SRV"
    ];

    const prefix =
      prefixes[
        Math.floor(
          Math.random() *
          prefixes.length
        )
      ];

    const randomNumber =
      Math.floor(
        100000 +
        Math.random() * 900000
      );

    const bookingID =
      `${prefix}-${randomNumber}`;
const sql = `
INSERT INTO TeampleSevaBooking
(name, mobile, seva_name, booking_date, amount, booking_status)
VALUES (?, ?, ?, ?, ?, ?)
`;

connection.query(
  sql,
  [
    devoteeName,
    mobile,
    sevaName,
    sevaDate,
    amount,
    "Confirmed"
  ],
  (err, result) => {
    if (err) {
      console.log("RDS Insert Error:", err);
    } else {
      console.log("Booking Saved In RDS");
    }
  }
);
const qrData = `
Booking ID: ${bookingID}
Name: ${devoteeName}
Seva: ${sevaName}
Date: ${sevaDate}
`;

const qrCodeImage = await QRCode.toDataURL(qrData);

console.log("QR Code Generated");
const base64Data = qrCodeImage.replace(
  /^data:image\/png;base64,/,
  ""
);

await s3.putObject(
  Bucket: "YOUR_S3_BUCKET"
  Key: `${bookingID}.png`,
  Body: Buffer.from(base64Data, "base64"),
  ContentType: "image/png"
}).promise();

console.log("QR Uploaded To S3");
    const booking = {
      BookingID: bookingID,
      QRUrl: https://YOUR_BUCKET.s3.amazonaws.com/
      DevoteeName: devoteeName,
      Mobile: mobile,
      Email: email,
      SevaName: sevaName,
      BookingDate: sevaDate,
      Amount: amount,
      Status: "Confirmed",
      CreatedAt:
        new Date().toISOString()
    };

    await ddbDocClient.send(
      new PutCommand({
        TableName:
          "TeampleSevaBookings",
        Item: booking
      })
    );

    console.log(
      "\n===== NEW BOOKING ====="
    );

    console.log(
      booking
    );

    res.json({
      success: true,
      booking
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      error: error.message
    });

  }

});

app.get("/", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "index.html"
    )
  );

});

app.listen(PORT, () => {

  console.log(
    `Server Running On http://localhost:${PORT}`
  );

});