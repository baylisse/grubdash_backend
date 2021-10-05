const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

function dishExists(req, res, next) {
    const dishId = req.params.dishId;
    const foundDish = dishes.find((dish) => dish.id = dishId);
    if(foundDish) {
       res.locals.dish = foundDish;
       return next(); 
    }
    next({
        status: 404,
        message: `Dish id not found: ${req.params.dishId}`
    })
}

function isValidDish(req, res, next) {
    const { data = {}} = req.body;
    const VALID_FIELDS = ["name", "description", "price", "image_url"];

    for (const field of VALID_FIELDS) {
        if (!data[field]) {
            return next({
                status: 400,
                message: `Field "${field}" is required`,
            })
        }
    }

    if (typeof data.price !== "number" || data.price <= 0) {
        return next({
            status: 400,
            message: `Field "price" must be number greater than zero`
        })
    }

    next();
}


// TODO: Implement the /dishes handlers needed to make the tests pass

function create(req, res) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDish = {
        id: nextId(),
        name: name,
        description: description,
        price: price,
        image_url: image_url,
    }
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}


function read(req, res) {
    res.json({
        data: res.locals.dish
    })
}

function update(req, res, next) {
    const { dishId } = req.params;
    const { data = {} } = req.body;
    const { id, name, description, price, image_url } = data;

    if(id && id !== dishId){
        return next({
            status: 400,
            message: `Data id field ${id} does not match route id: ${req.originalUrl}`
        })
    }

    const updatedDish = {
        id: dishId,
        name,
        description,
        price,
        image_url,
    }

    const dish = res.locals.dish
    Object.assign(dish, updatedDish)
    
    res.status(200).json({ data: updatedDish})
}


function list(req, res) {
    res.json({
        data: dishes
    })
}

module.exports = {
    create: [isValidDish, create],
    read: [dishExists, read],
    update: [dishExists, isValidDish, update],
    list,
}
