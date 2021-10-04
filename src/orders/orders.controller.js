const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

function orderExists(req, res, next) {
    const orderId = req.params.orderId;
    const foundOrder = orders.find((order) => order.id = orderId);
    if(foundOrder) {
       res.locals.order = foundOrder;
       return next();
    }
    next({
        status: 404,
        message: `Order id not found: ${req.params.orderId}`,
    });
}

function validateOrder(req, res, next) {
    const { data = {}} = req.body;
    const VALID_FIELDS = ["deliverTo", "mobileNumber", "dishes"];

    for (const field of VALID_FIELDS) {
        if (!data[field]) {
            return next({
                status: 400,
                message: `Field "${field}" is required`,
            })
        }
    }
    
    if(!Array.isArray(data.dishes) || data.dishes.length === 0) {
        return next({
            status: 400,
            message: `Field "dishes" must be greater than zero`
        })
    }

    for(let i=0; i < data.dishes.length; i++) {
        const dish = data.dishes[i];
        if(dish.quantity === 0 || typeof dish.quantity !== "number"){
            return next({
                status: 400,
                message: `Dish ${i} quantity is invalid`
            })
        }            
    }

    next();
}

function orderNotPending(req, res, next) {
    const status = res.locals.order.status;
    if(status !== "pending") {
        return next({
            status: 400,
            message: `Status should be pending`
        })
    }
    next();
}
// TODO: Implement the /orders handlers needed to make the tests pass

function create(req, res) {
    const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo: deliverTo,
        mobileNumber: mobileNumber,
        status: "pending",
        dishes: dishes,
    }
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}



function read(req, res) {
    res.json({ data: res.locals.order })
}

function update(req, res, next){
    const { orderId } = req.params;
    const { data = {} } = req.body;
    const { id, deliverTo, mobileNumber, status, dishes } = data;

    if(id && id !== orderId){
        return next({
            status: 400,
            message: `Data id field ${id} does not match route id: ${req.originalUrl}`
        })
    }

    if(status !== "pending") {
        return next({
            status: 400,
            message: `Order status ${status} cannot be changed`
        })
    }

    const updatedOrder = {
        id: orderId,
        deliverTo,
        mobileNumber,
        status,
        dishes,
    }

    const order = orders.find(o => o.id === orderId)
    Object.assign(order, updatedOrder)
    
    res.status(200).json({ data: updatedOrder})
}

function destroy(req, res) {
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === orderId);
    if (index > -1) {
        orders.splice(index, 1);
    }
    res.sendStatus(204);
}

function list(req, res) {
    res.json({ data: orders })
}


module.exports = {
    create: [validateOrder, create],
    read: [orderExists, read],
    update: [orderExists, validateOrder, update],
    destroy: [orderExists, orderNotPending, destroy],
    list,
}
