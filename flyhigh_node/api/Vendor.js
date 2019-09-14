const router = require("express").Router();
const dbHelper = require("../lib/db");
const uuidv4 = require("uuid/v4");

// Get counts
router.get("/counts", (req, res) => {
	let retData = {};
	let userId = null;
	dbHelper.getUserFromEmail(req.db, "Vendor", req.authInfo.userInfo.email).then(user => {
		userId = user.id;
		return dbHelper.query(req.db,
			"SELECT COUNT(*) AS \"discounts\" FROM \"model.CatalogDiscount\" WHERE \"vendorid\" = ? AND \"discountid\" IS NOT NULL", [userId]);
	}).then(discountData => {
		retData.discounts = discountData.length > 0 ? discountData[0].discounts : 0;
		return dbHelper.query(req.db, "SELECT COUNT(*) AS \"items\"	FROM \"model.Catalog\" WHERE \"vendor.id\" = ?", [userId]);
	}).then(itemsData => {
		retData.items = itemsData.length > 0 ? itemsData[0].items : 0;
		res.status(200).send({
			data: retData
		});
	}).catch(err => {
		res.status(500).send({
			error: err
		});
	});
});

// Get own catalog
router.get("/catalog", (req, res) => {
	dbHelper.getUserFromEmail(req.db, "Vendor", req.authInfo.userInfo.email).then(user => {
		return dbHelper.query(req.db, "SELECT * FROM \"model.CatalogDiscount\" WHERE \"vendorid\" = ?", [user.id]);
	}).then(data => {
		res.status(200).send({
			data: data
		});
	}).catch(err => {
		res.status(500).send({
			error: err
		});
	});
});

// Add item to catalog
router.post("/catalog", (req, res) => {
	if (!req.body && !req.body.model && !req.body.category && !req.body.retailPrice && !req.body.description) {
		return res.status(400).send({
			error: "Provide model, category, retialPrice & description fields."
		});
	}
	let uuid = uuidv4();
	dbHelper.getUserFromEmail(req.db, "Vendor", req.authInfo.userInfo.email).then(user => {
		return dbHelper.query(req.db, "INSERT INTO \"model.Catalog\" VALUES(?, ?, ?, ?, ?, ?)", [uuid, req.body.model, req.body.category,
			user.id,
			req.body.retailPrice,
			req.body.description
		]);
	}).then(() => {
		res.status(201).send({});
	}).catch(err => {
		res.status(500).send({
			error: err
		});
	});
});

// Add discount
router.post("/discount", (req, res) => {
	if (!req.body && !req.body.catalogid && !req.body.startdate && !req.body.enddate) {
		return res.status(400).send({
			error: "Provide startdate & enddate."
		});
	}
	let uuid = uuidv4();
	if(!req.body.absdisc) req.body.absdisc = 0;
	if(!req.body.perdisc) req.body.perdisc = 0;
	dbHelper.query(req.db, "INSERT INTO \"model.Discount\" VALUES(?, ?, ?, ?, ?, ?, ?)", [uuid, req.body.catalogid,
		req.body.startdate,
		req.body.enddate,
		req.body.absdisc,
		req.body.perdisc,
		null
	]).then(() => {
		res.status(201).send({});
	}).catch(err => {
		res.status(500).send({
			error: err
		});
	});
});

// Delete discount
router.delete("/discount/:discountid", (req, res) => {
	dbHelper.query(req.db, "DELETE FROM \"model.Discount\" WHERE \"id\" = ?", [req.params.discountid]).then(() => {
		res.status(204).send({});
	}).catch(err => {
		res.status(500).send({
			error: err
		});
	});
});

// Apply common API endpoints
require("./_common")(router, "Vendor");

module.exports = router;