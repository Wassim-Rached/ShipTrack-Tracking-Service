import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import NodeCache from "node-cache";

type Tracking = {
  tracking_id: string;
  status: string;
  timestamp: string;
  location: string;
  shipment_id: string;
  carrier_id: string;
};

dotenv.config();

// In-memory database structure
const db = new NodeCache({ stdTTL: 86400 });

// Create an Express application
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Route to create a shipment
app.post("/service/trackings", async (req: Request, res: Response) => {
  try {
    const requiredFields = [
      "carrier_id",
      "location",
      "shipment_id",
      "status",
      "timestamp",
    ];

    const missingFields = requiredFields.filter((field) => !req.body[field]);
    if (missingFields.length > 0) {
      res
        .status(400)
        .json({ error: `Missing fields: ${missingFields.join(", ")}` });
      return;
    }

    const tracking: Tracking = {
      carrier_id: req.body.carrier_id,
      location: req.body.location,
      shipment_id: req.body.shipment_id,
      status: req.body.status,
      timestamp: req.body.timestamp,
      tracking_id: Math.random().toString(36).substring(7),
    };

    const newShipment = db.set(tracking.tracking_id, tracking);
    res.status(201).json(newShipment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Route to get a shipment by ID
app.get("/service/trackings/:id", async (req: Request, res: Response) => {
  try {
    const shipmentId = req.params.id;

    if (!shipmentId) {
      res.status(400).json({ error: "Shipment ID is required" });
      return;
    }

    // get all of the trackings
    const shipments: Tracking[] = Object.values(db.mget(db.keys())).filter(
      (tracking) => (tracking as Tracking).shipment_id == shipmentId
    ) as Tracking[];

    // Respond with the retrieved shipment
    res.json(shipments);
  } catch (error: any) {
    console.error("Error getting shipment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
